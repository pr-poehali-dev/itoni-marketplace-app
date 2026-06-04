import json
import os
import random
import string
import hashlib
import hmac
import smtplib
import urllib.request
import urllib.parse
from email.mime.text import MIMEText
from email.header import Header
from datetime import datetime, timedelta
import psycopg2
from admin import handle_admin

SUPPORT_EMAIL = 'muratdzaurov@mail.ru'


def hash_password(password: str) -> str:
    salt = os.environ.get('DATABASE_URL', 'itoni-salt')[:16]
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()


def check_password(password: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(password), hashed or '')


def send_email_code(to_email: str, code: str) -> bool:
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not smtp_user or not smtp_password:
        return False
    text = (
        f"Ваш код для входа в иТони: {code}\n\n"
        "Код действует 10 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо."
    )
    msg = MIMEText(text, 'plain', 'utf-8')
    msg['Subject'] = Header('Код для входа в иТони', 'utf-8')
    msg['From'] = smtp_user
    msg['To'] = to_email
    server = smtplib.SMTP_SSL('smtp.mail.ru', 465, timeout=20)
    server.login(smtp_user, smtp_password)
    server.sendmail(smtp_user, [to_email], msg.as_string())
    server.quit()
    return True


def user_payload(user_row):
    return {
        'id': user_row[0],
        'name': user_row[1],
        'phone': user_row[2] or '',
        'city': user_row[3],
        'region': user_row[4],
        'photo': user_row[5],
        'accepted_terms': bool(user_row[6]),
        'login': user_row[7],
        'email': user_row[8],
        'show_phone': bool(user_row[9]) if len(user_row) > 9 and user_row[9] is not None else True,
    }


def normalize_phone(raw: str) -> str:
    digits = ''.join(ch for ch in (raw or '') if ch.isdigit())
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return '+' + digits if digits else ''


def send_call_code(phone: str, ip: str = ''):
    """Звонок-авторизация SMS.RU (code/call). Код = последние 4 цифры входящего номера.
    Возвращает (ok: bool, code: str|None, error: str|None, called: bool).
    called=False означает, что реального дозвона не было (free_repeat / cost=0)."""
    api_key = (os.environ.get('SMS_API_KEY') or '').strip()
    if not api_key:
        return False, None, 'Ключ SMS не настроен', False
    to = phone.lstrip('+')
    query = {
        'api_id': api_key,
        'phone': to,
        'json': 1,
    }
    if ip:
        query['ip'] = ip
    params = urllib.parse.urlencode(query)
    url = f'https://sms.ru/code/call?{params}'
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
        print('SMS.RU code/call response:', raw)
        data = json.loads(raw)
    except Exception as e:
        print('SMS.RU code/call error:', repr(e))
        return False, None, 'Сервис звонков временно недоступен', False
    if data.get('status') == 'OK':
        # Реальный дозвон был, если списана стоимость и это не повтор
        try:
            cost = float(data.get('cost') or 0)
        except (ValueError, TypeError):
            cost = 0.0
        called = cost > 0 and not data.get('free_repeat')
        return True, str(data.get('code', '')), None, called
    text = data.get('status_text') or ''
    return False, None, text or 'Не удалось совершить звонок', False


def send_sms_code_ru(phone: str, code: str, ip: str = ''):
    """Фолбэк: отправить код обычной SMS через SMS.RU (sms/send).
    Возвращает (ok: bool, error: str|None)."""
    api_key = (os.environ.get('SMS_API_KEY') or '').strip()
    if not api_key:
        return False, 'Ключ SMS не настроен'
    to = phone.lstrip('+')
    query = {
        'api_id': api_key,
        'to': to,
        'msg': f'Код для входа в иТони: {code}',
        'json': 1,
    }
    if ip:
        query['ip'] = ip
    params = urllib.parse.urlencode(query)
    url = f'https://sms.ru/sms/send?{params}'
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
        print('SMS.RU sms/send response:', raw)
        data = json.loads(raw)
    except Exception as e:
        print('SMS.RU sms/send error:', repr(e))
        return False, 'Сервис SMS временно недоступен'
    if data.get('status') == 'OK':
        sms = (data.get('sms') or {}).get(to, {})
        if sms.get('status') == 'OK':
            return True, None
        return False, sms.get('status_text') or 'Не удалось отправить SMS'
    return False, data.get('status_text') or 'Не удалось отправить SMS'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Admin-Token',
    'Content-Type': 'application/json'
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Авторизация: отправка SMS-кода, верификация, принятие условий, удаление аккаунта"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = {}
    raw_body = event.get('body')
    if raw_body:
        try:
            body = json.loads(raw_body)
        except (ValueError, TypeError):
            body = {}
    action = body.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    # Админ-панель (action начинается с admin_)
    if action.startswith('admin_'):
        try:
            return handle_admin(action, event, body, conn, cur)
        finally:
            cur.close(); conn.close()

    # Публичный: записать установку приложения
    if method == 'POST' and action == 'track_install':
        user_id = event.get('headers', {}).get('X-User-Id')
        cur.execute(
            "INSERT INTO itoni_installs (user_id, device_info, city, region) VALUES (%s,%s,%s,%s)",
            (int(user_id) if user_id else None, body.get('device_info'), body.get('city'), body.get('region'))
        )
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # Публичный: активные баннеры
    if action == 'get_banners':
        cur.execute("SELECT id, title, image_url, link_url FROM itoni_banners WHERE is_active=TRUE ORDER BY position ASC, id DESC")
        rows = cur.fetchall()
        cur.close(); conn.close()
        banners = [{'id': r[0], 'title': r[1], 'image_url': r[2], 'link_url': r[3]} for r in rows]
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'banners': banners})}

    # Публичный: тексты главной и активные категории
    if action == 'get_home':
        cur.execute("SELECT section, content FROM itoni_home_content WHERE is_active=TRUE")
        content = {r[0]: r[1] for r in cur.fetchall()}
        cur.execute("SELECT slug, name, icon FROM itoni_categories WHERE is_active=TRUE ORDER BY sort_order ASC, id ASC")
        cats = [{'id': r[0], 'label': r[1], 'emoji': r[2]} for r in cur.fetchall()]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'content': content, 'categories': cats})}

    USER_COLS = "id, name, phone, city, region, photo, accepted_terms, login, email, show_phone"

    # POST sms_send - позвонить и продиктовать код (последние 4 цифры номера звонка)
    if method == 'POST' and action == 'sms_send':
        phone = normalize_phone(body.get('phone') or '')
        if len(phone) < 12:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите корректный номер телефона'})}

        # IP пользователя для SMS.RU (защита от блокировок и антифрод)
        user_ip = (event.get('requestContext', {}) or {}).get('identity', {}).get('sourceIp', '') or ''

        ok, code, err, called = send_call_code(phone, user_ip)

        delivery = 'call'
        message = 'Сейчас вам позвонит робот. Ответьте и введите 4 цифры номера, с которого поступит звонок.'

        # Фолбэк: если звонок не удался или дозвона по факту не было — шлём SMS со своим кодом
        if not ok or not code or not called:
            sms_code = ''.join(random.choices(string.digits, k=4))
            sms_ok, sms_err = send_sms_code_ru(phone, sms_code, user_ip)
            if sms_ok:
                code = sms_code
                delivery = 'sms'
                message = 'Мы отправили код в SMS. Введите код из сообщения.'
            elif not ok or not code:
                cur.close(); conn.close()
                return {'statusCode': 503, 'headers': CORS_HEADERS, 'body': json.dumps({'error': err or sms_err or 'Не удалось отправить код. Попробуйте позже.'})}

        expires_at = datetime.now() + timedelta(minutes=3)
        cur.execute("INSERT INTO itoni_sms_codes (phone, code, expires_at) VALUES (%s, %s, %s)", (phone, code.strip(), expires_at))
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'delivery': delivery, 'message': message})}

    # POST sms_verify - проверить код и войти/зарегистрировать
    if method == 'POST' and action == 'sms_verify':
        phone = normalize_phone(body.get('phone') or '')
        code = (body.get('code') or '').strip()
        if not phone or not code:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите номер и код'})}

        cur.execute(
            "SELECT id FROM itoni_sms_codes WHERE phone=%s AND code=%s AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            (phone, code)
        )
        code_row = cur.fetchone()
        if not code_row:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный или устаревший код'})}
        cur.execute("UPDATE itoni_sms_codes SET used=TRUE WHERE id=%s", (code_row[0],))

        cur.execute("SELECT " + USER_COLS + " FROM itoni_users WHERE phone=%s", (phone,))
        user = cur.fetchone()
        is_new = False
        if not user:
            cur.execute(
                "INSERT INTO itoni_users (phone) VALUES (%s) RETURNING " + USER_COLS,
                (phone,)
            )
            user = cur.fetchone()
            is_new = True
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'is_new': is_new, 'accepted_terms': bool(user[6]), 'user': user_payload(user)})}

    # POST register - регистрация по логину и паролю
    if method == 'POST' and action == 'register':
        login = (body.get('login') or '').strip()
        password = body.get('password') or ''
        name = (body.get('name') or '').strip()
        if len(login) < 3:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Логин минимум 3 символа'})}
        if len(password) < 6:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

        cur.execute("SELECT id FROM itoni_users WHERE LOWER(login)=LOWER(%s)", (login,))
        if cur.fetchone():
            cur.close(); conn.close()
            return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Такой логин уже занят'})}

        cur.execute(
            "INSERT INTO itoni_users (login, password_hash, name) VALUES (%s, %s, %s) RETURNING id, name, phone, city, region, photo, accepted_terms, login, email",
            (login, hash_password(password), name or login)
        )
        user = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'is_new': True, 'accepted_terms': bool(user[6]), 'user': user_payload(user)})}

    # POST login - вход по логину и паролю
    if method == 'POST' and action == 'login':
        login = (body.get('login') or '').strip()
        password = body.get('password') or ''
        if not login or not password:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

        cur.execute("SELECT " + USER_COLS + ", password_hash FROM itoni_users WHERE LOWER(login)=LOWER(%s)", (login,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row or not check_password(password, row[9]):
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'is_new': False, 'accepted_terms': bool(row[6]), 'user': user_payload(row)})}

    # POST email_send - отправить код на email
    if method == 'POST' and action == 'email_send':
        email = (body.get('email') or '').strip().lower()
        if '@' not in email or '.' not in email:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите корректный email'})}

        code = ''.join(random.choices(string.digits, k=4))
        expires_at = datetime.now() + timedelta(minutes=10)
        cur.execute("INSERT INTO itoni_email_codes (email, code, expires_at) VALUES (%s, %s, %s)", (email, code, expires_at))
        conn.commit()
        cur.close(); conn.close()

        if not send_email_code(email, code):
            return {'statusCode': 503, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Отправка на email пока не настроена. Попробуйте вход по логину и паролю.'})}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'message': f'Код отправлен на {email}'})}

    # POST email_verify - проверить код с email и войти/зарегистрировать
    if method == 'POST' and action == 'email_verify':
        email = (body.get('email') or '').strip().lower()
        code = (body.get('code') or '').strip()
        if not email or not code:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите email и код'})}

        cur.execute(
            "SELECT id FROM itoni_email_codes WHERE email=%s AND code=%s AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            (email, code)
        )
        code_row = cur.fetchone()
        if not code_row:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный или устаревший код'})}
        cur.execute("UPDATE itoni_email_codes SET used=TRUE WHERE id=%s", (code_row[0],))

        cur.execute("SELECT " + USER_COLS + " FROM itoni_users WHERE LOWER(email)=LOWER(%s)", (email,))
        user = cur.fetchone()
        is_new = False
        if not user:
            cur.execute(
                "INSERT INTO itoni_users (email, name) VALUES (%s, %s) RETURNING id, name, phone, city, region, photo, accepted_terms, login, email",
                (email, email.split('@')[0])
            )
            user = cur.fetchone()
            is_new = True
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'is_new': is_new, 'accepted_terms': bool(user[6]), 'user': user_payload(user)})}

    # POST support - обращение в поддержку (письмо администратору)
    if method == 'POST' and action == 'support':
        cur.close(); conn.close()
        message = (body.get('message') or '').strip()
        contact = (body.get('contact') or '').strip()
        user_phone = (body.get('phone') or '').strip()

        if not message:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите текст обращения'})}

        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        if not smtp_user or not smtp_password:
            return {'statusCode': 503, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Отправка временно недоступна. Попробуйте позже.'})}

        text = (
            "Новое обращение в поддержку иТони\n\n"
            f"Телефон пользователя: {user_phone or 'не указан'}\n"
            f"Контакт для связи: {contact or 'не указан'}\n\n"
            f"Сообщение:\n{message}\n"
        )
        msg = MIMEText(text, 'plain', 'utf-8')
        msg['Subject'] = Header('Обращение в поддержку иТони', 'utf-8')
        msg['From'] = smtp_user
        msg['To'] = SUPPORT_EMAIL
        if contact and '@' in contact:
            msg['Reply-To'] = contact

        server = smtplib.SMTP_SSL('smtp.mail.ru', 465, timeout=20)
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [SUPPORT_EMAIL], msg.as_string())
        server.quit()

        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # POST accept - принять условия (завершить регистрацию)
    if method == 'POST' and action == 'accept':
        user_id = event.get('headers', {}).get('X-User-Id')
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

        cur.execute(
            "UPDATE itoni_users SET accepted_terms=TRUE, accepted_at=NOW() WHERE id=%s RETURNING id, name, phone, city, region, photo, accepted_terms",
            (int(user_id),)
        )
        user = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        if not user:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'user': {'id': user[0], 'name': user[1], 'phone': user[2], 'city': user[3], 'region': user[4], 'photo': user[5], 'accepted_terms': bool(user[6])}})
        }

    # DELETE / - удалить аккаунт пользователя
    if method == 'DELETE':
        user_id = event.get('headers', {}).get('X-User-Id')
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

        uid = int(user_id)
        cur.execute("DELETE FROM itoni_listings WHERE user_id=%s", (uid,))
        cur.execute("DELETE FROM itoni_messages WHERE sender_id=%s OR receiver_id=%s", (uid, uid))
        cur.execute("DELETE FROM itoni_favorites WHERE user_id=%s", (uid,))
        cur.execute("DELETE FROM itoni_users WHERE id=%s", (uid,))
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # PUT / - обновить профиль
    if method == 'PUT':
        user_id = event.get('headers', {}).get('X-User-Id')
        if not user_id:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

        # Обновление переключателя показа номера (отдельный кейс)
        if 'show_phone' in body:
            cur.execute(
                "UPDATE itoni_users SET show_phone=%s WHERE id=%s RETURNING id, name, phone, city, region, photo, accepted_terms, login, email, show_phone",
                (bool(body.get('show_phone')), int(user_id))
            )
            user = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()
            if not user:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'user': user_payload(user)})}

        name = body.get('name')
        city = body.get('city')
        region = body.get('region')
        photo = body.get('photo')
        new_phone = body.get('phone')

        if new_phone is not None:
            cur.execute(
                "UPDATE itoni_users SET name=%s, city=%s, region=%s, photo=%s, phone=%s WHERE id=%s RETURNING id, name, phone, city, region, photo, accepted_terms, login, email, show_phone",
                (name, city, region, photo, normalize_phone(new_phone), int(user_id))
            )
        else:
            cur.execute(
                "UPDATE itoni_users SET name=%s, city=%s, region=%s, photo=%s WHERE id=%s RETURNING id, name, phone, city, region, photo, accepted_terms, login, email, show_phone",
                (name, city, region, photo, int(user_id))
            )
        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not user:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'user': user_payload(user)})
        }

    cur.close()
    conn.close()
    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}