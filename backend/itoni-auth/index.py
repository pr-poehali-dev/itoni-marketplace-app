import json
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from datetime import datetime, timedelta
import psycopg2

SUPPORT_EMAIL = 'muratdzaurov@mail.ru'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
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

    # POST send - отправить SMS код
    if method == 'POST' and action == 'send':
        phone = body.get('phone', '').strip()
        if not phone:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите номер телефона'})}

        code = ''.join(random.choices(string.digits, k=4))
        expires_at = datetime.now() + timedelta(minutes=10)

        cur.execute(
            "INSERT INTO itoni_sms_codes (phone, code, expires_at) VALUES (%s, %s, %s)",
            (phone, code, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()

        # В реальном проекте здесь отправляется SMS
        # Для демо возвращаем код в ответе
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'demo_code': code, 'message': f'Код отправлен на {phone}'})
        }

    # POST verify - проверить код и войти
    if method == 'POST' and action == 'verify':
        phone = body.get('phone', '').strip()
        code = body.get('code', '').strip()

        if not phone or not code:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите телефон и код'})}

        cur.execute(
            "SELECT id FROM itoni_sms_codes WHERE phone=%s AND code=%s AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            (phone, code)
        )
        sms_row = cur.fetchone()

        if not sms_row:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный или устаревший код'})}

        cur.execute("UPDATE itoni_sms_codes SET used=TRUE WHERE id=%s", (sms_row[0],))

        cur.execute("SELECT id, name, city, region, photo, accepted_terms FROM itoni_users WHERE phone=%s", (phone,))
        user = cur.fetchone()

        is_new = False
        if not user:
            cur.execute(
                "INSERT INTO itoni_users (phone) VALUES (%s) RETURNING id, name, city, region, photo, accepted_terms",
                (phone,)
            )
            user = cur.fetchone()
            is_new = True

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'is_new': is_new,
                'accepted_terms': bool(user[5]),
                'user': {
                    'id': user[0],
                    'name': user[1],
                    'phone': phone,
                    'city': user[2],
                    'region': user[3],
                    'photo': user[4],
                    'accepted_terms': bool(user[5])
                }
            })
        }

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

        name = body.get('name')
        city = body.get('city')
        region = body.get('region')
        photo = body.get('photo')

        cur.execute(
            "UPDATE itoni_users SET name=%s, city=%s, region=%s, photo=%s WHERE id=%s RETURNING id, name, phone, city, region, photo",
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
            'body': json.dumps({'success': True, 'user': {'id': user[0], 'name': user[1], 'phone': user[2], 'city': user[3], 'region': user[4], 'photo': user[5]}})
        }

    cur.close()
    conn.close()
    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}