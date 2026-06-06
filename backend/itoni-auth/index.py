import json
import os
import re
import hashlib
import hmac
import smtplib
import jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from datetime import datetime, timedelta, timezone
import psycopg2
from admin import handle_admin

SUPPORT_EMAIL = 'muratdzaurov@mail.ru'
APP_URL = 'https://itoni.ru'


def hash_password(password: str) -> str:
    salt = os.environ.get('DATABASE_URL', 'itoni-salt')[:16]
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()


def check_password(password: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(password), hashed or '')


def make_magic_token(email: str) -> str:
    secret = os.environ.get('JWT_SECRET') or os.environ.get('DATABASE_URL', 'itoni-secret')
    payload = {
        'email': email,
        'purpose': 'magic_login',
        'exp': datetime.now(timezone.utc) + timedelta(minutes=15),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def verify_magic_token(token: str):
    secret = os.environ.get('JWT_SECRET') or os.environ.get('DATABASE_URL', 'itoni-secret')
    try:
        data = jwt.decode(token, secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None, 'Ссылка устарела. Запросите новую.'
    except jwt.InvalidTokenError:
        return None, 'Ссылка недействительна.'
    if data.get('purpose') != 'magic_login' or not data.get('email'):
        return None, 'Ссылка недействительна.'
    return data['email'], None


def send_magic_link(to_email: str, token: str):
    raw_user = (os.environ.get('SMTP_USER') or '').strip()
    # Извлекаем корректный email, даже если в секрет попали лишние символы/пробелы
    m = re.search(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', raw_user)
    smtp_user = m.group(0) if m else raw_user
    raw_password = os.environ.get('SMTP_PASSWORD')
    smtp_password = (raw_password or '').strip()
    print(json.dumps({
        'event': 'magic_link_attempt',
        'raw_user_len': len(raw_user),
        'raw_password_is_none': raw_password is None,
        'raw_password_len': len(raw_password) if raw_password else 0,
        'clean_user': smtp_user,
        'smtp_user_present': bool(smtp_user),
        'smtp_password_present': bool(smtp_password),
        'smtp_user_len': len(smtp_user) if smtp_user else 0,
        'smtp_password_len': len(smtp_password) if smtp_password else 0,
        'jwt_secret_present': bool(os.environ.get('JWT_SECRET')),
        'to': to_email,
    }))
    missing = []  # noqa
    if not smtp_user:
        missing.append('SMTP_USER')
    if not smtp_password:
        missing.append('SMTP_PASSWORD')
    if missing:
        reason = 'Не заданы секреты: ' + ', '.join(missing)
        print(json.dumps({'event': 'magic_link_error', 'reason': 'smtp_secrets_missing', 'missing': missing}))
        return False, reason
    link = f"{APP_URL}/auth/verify?token={token}"
    html = (
        "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px\">"
        "<h2 style=\"color:#2563eb;margin:0 0 8px\">иТони</h2>"
        "<p style=\"color:#111;font-size:16px\">Нажмите кнопку, чтобы войти в приложение:</p>"
        f"<a href=\"{link}\" style=\"display:inline-block;background:#2563eb;color:#fff;"
        "text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:12px;margin:16px 0\">"
        "Войти в иТони</a>"
        "<p style=\"color:#666;font-size:13px\">Ссылка действует 15 минут. "
        "Если вы не запрашивали вход — просто проигнорируйте это письмо.</p>"
        f"<p style=\"color:#999;font-size:12px;word-break:break-all\">{link}</p>"
        "</div>"
    )
    text = f"Войдите в иТони по ссылке (действует 15 минут):\n{link}"
    msg = MIMEMultipart('alternative')
    msg['Subject'] = Header('Вход в иТони', 'utf-8')
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg.attach(MIMEText(text, 'plain', 'utf-8'))
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    raw = msg.as_string()
    host = os.environ.get('SMTP_HOST', 'smtp.mail.ru')

    # Способ 1: SSL на 465. Способ 2 (запасной): STARTTLS на 587.
    last_detail = ''
    for mode, port in (('ssl', 465), ('starttls', 587)):
        try:
            if mode == 'ssl':
                server = smtplib.SMTP_SSL(host, port, timeout=25)
            else:
                server = smtplib.SMTP(host, port, timeout=25)
                server.ehlo()
                server.starttls()
                server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [to_email], raw)
            server.quit()
            print(json.dumps({'event': 'magic_link_sent', 'to': to_email, 'mode': mode, 'port': port}))
            return True, None
        except smtplib.SMTPAuthenticationError as e:
            # Неверный пароль — повтор на другом порту не поможет
            print(json.dumps({'event': 'magic_link_error', 'reason': 'smtp_auth_failed', 'detail': str(e)}))
            return False, 'Почта отклонила логин/пароль. Нужен «пароль для внешних приложений» mail.ru.'
        except Exception as e:
            last_detail = str(e)
            print(json.dumps({'event': 'magic_link_retry', 'mode': mode, 'port': port, 'detail': last_detail}))
            continue

    print(json.dumps({'event': 'magic_link_error', 'reason': 'smtp_send_failed', 'detail': last_detail}))
    return False, f'Не удалось отправить письмо: {last_detail[:120]}'


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


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Admin-Token',
    'Content-Type': 'application/json'
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Авторизация: вход по магической ссылке на email, сохранение телефона, принятие условий, профиль"""
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

    # Сохранить OneSignal ID пользователя (для push-уведомлений)
    if method == 'POST' and action == 'save_push_id':
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        onesignal_id = (body.get('onesignal_id') or '').strip()
        if not user_id or not onesignal_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Нет данных'})}
        cur.execute("UPDATE itoni_users SET onesignal_id=%s WHERE id=%s", (onesignal_id, int(user_id)))
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # Включить/выключить push-уведомления
    if method == 'POST' and action == 'set_push_enabled':
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        enabled = bool(body.get('enabled'))
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
        cur.execute("UPDATE itoni_users SET push_enabled=%s WHERE id=%s", (enabled, int(user_id)))
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

    # POST magic_request - отправить магическую ссылку для входа на email
    if method == 'POST' and action == 'magic_request':
        email = (body.get('email') or '').strip().lower()
        if '@' not in email or '.' not in email.split('@')[-1]:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите корректный email'})}
        cur.close(); conn.close()
        token = make_magic_token(email)
        ok, reason = send_magic_link(email, token)
        if not ok:
            return {'statusCode': 503, 'headers': CORS_HEADERS, 'body': json.dumps({'error': reason or 'Отправка письма временно недоступна. Попробуйте позже.'})}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'message': f'Ссылка для входа отправлена на {email}'})}

    # POST magic_verify - проверить токен из ссылки и войти/создать пользователя
    if method == 'POST' and action == 'magic_verify':
        token = (body.get('token') or '').strip()
        if not token:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Нет токена'})}
        email, err = verify_magic_token(token)
        if err:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': err})}

        cur.execute("SELECT " + USER_COLS + " FROM itoni_users WHERE LOWER(email)=LOWER(%s)", (email,))
        user = cur.fetchone()
        is_new = False
        if not user:
            cur.execute(
                "INSERT INTO itoni_users (email, name) VALUES (%s, %s) RETURNING " + USER_COLS,
                (email, email.split('@')[0])
            )
            user = cur.fetchone()
            is_new = True
        conn.commit()
        cur.close(); conn.close()
        needs_phone = not (user[2] or '').strip()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
            'success': True, 'is_new': is_new, 'needs_phone': needs_phone,
            'accepted_terms': bool(user[6]), 'user': user_payload(user)
        })}

    # POST set_phone - сохранить номер телефона (без подтверждения)
    if method == 'POST' and action == 'set_phone':
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
        phone = normalize_phone(body.get('phone') or '')
        if len(phone) < 12:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите корректный номер телефона'})}

        cur.execute(
            "UPDATE itoni_users SET phone=%s WHERE id=%s RETURNING " + USER_COLS,
            (phone, int(user_id))
        )
        user = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        if not user:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'})}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
            'success': True, 'accepted_terms': bool(user[6]), 'user': user_payload(user)
        })}

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