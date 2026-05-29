import json
import os
import random
import string
from datetime import datetime, timedelta
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Content-Type': 'application/json'
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Авторизация пользователя: отправка SMS-кода и верификация"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
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

        cur.execute("SELECT id, name, city, region, photo FROM itoni_users WHERE phone=%s", (phone,))
        user = cur.fetchone()

        if not user:
            cur.execute(
                "INSERT INTO itoni_users (phone) VALUES (%s) RETURNING id, name, city, region, photo",
                (phone,)
            )
            user = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': user[0],
                    'name': user[1],
                    'phone': phone,
                    'city': user[2],
                    'region': user[3],
                    'photo': user[4]
                }
            })
        }

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