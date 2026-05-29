import json
import os
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
    """Чат: получение и отправка сообщений между пользователями"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    raw_body = event.get('body')
    if raw_body:
        try:
            body = json.loads(raw_body)
        except (ValueError, TypeError):
            body = {}

    user_id = event.get('headers', {}).get('X-User-Id')
    if not user_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
    user_id = int(user_id)

    conn = get_conn()
    cur = conn.cursor()

    # GET ?mode=chats - список чатов пользователя
    if method == 'GET' and params.get('mode') == 'chats':
        cur.execute(
            """SELECT DISTINCT ON (
                LEAST(m.sender_id, m.receiver_id),
                GREATEST(m.sender_id, m.receiver_id),
                m.listing_id
               )
               m.id, m.sender_id, m.receiver_id, m.listing_id, m.text, m.created_at, m.is_read,
               u.name, u.photo,
               l.title, l.images
               FROM itoni_messages m
               LEFT JOIN itoni_users u ON u.id = CASE WHEN m.sender_id=%s THEN m.receiver_id ELSE m.sender_id END
               LEFT JOIN itoni_listings l ON l.id = m.listing_id
               WHERE m.sender_id=%s OR m.receiver_id=%s
               ORDER BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id), m.listing_id, m.created_at DESC""",
            (user_id, user_id, user_id)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()

        chats = []
        for r in rows:
            other_id = r[2] if r[1] == user_id else r[1]
            chats.append({
                'message_id': r[0],
                'other_user_id': other_id,
                'listing_id': r[3],
                'last_message': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
                'is_read': r[6],
                'other_name': r[7] or 'Пользователь',
                'other_photo': r[8],
                'listing_title': r[9],
                'listing_image': (list(r[10])[0] if r[10] else None)
            })
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'chats': chats})}

    # GET / - история переписки
    if method == 'GET':
        other_id = params.get('other_id')
        listing_id = params.get('listing_id')

        if not other_id or not listing_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите other_id и listing_id'})}

        other_id = int(other_id)
        listing_id = int(listing_id)

        cur.execute(
            """SELECT m.id, m.sender_id, m.receiver_id, m.text, m.created_at, m.is_read,
               u.name, u.photo
               FROM itoni_messages m
               LEFT JOIN itoni_users u ON u.id = m.sender_id
               WHERE m.listing_id=%s AND (
                 (m.sender_id=%s AND m.receiver_id=%s) OR
                 (m.sender_id=%s AND m.receiver_id=%s)
               )
               ORDER BY m.created_at ASC""",
            (listing_id, user_id, other_id, other_id, user_id)
        )
        rows = cur.fetchall()

        cur.execute(
            "UPDATE itoni_messages SET is_read=TRUE WHERE receiver_id=%s AND sender_id=%s AND listing_id=%s",
            (user_id, other_id, listing_id)
        )
        conn.commit()

        cur.execute(
            "SELECT id, name, photo, phone FROM itoni_users WHERE id=%s",
            (other_id,)
        )
        other = cur.fetchone()
        cur.close(); conn.close()

        messages = [{
            'id': r[0],
            'sender_id': r[1],
            'receiver_id': r[2],
            'text': r[3],
            'created_at': r[4].isoformat() if r[4] else None,
            'is_read': r[5],
            'sender_name': r[6],
            'sender_photo': r[7]
        } for r in rows]

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'messages': messages,
                'other_user': {'id': other[0], 'name': other[1], 'photo': other[2], 'phone': other[3]} if other else None
            })
        }

    # POST / - отправить сообщение
    if method == 'POST':
        receiver_id = body.get('receiver_id')
        listing_id = body.get('listing_id')
        text = body.get('text', '').strip()

        if not receiver_id or not listing_id or not text:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите получателя, объявление и текст'})}

        cur.execute(
            "INSERT INTO itoni_messages (sender_id, receiver_id, listing_id, text) VALUES (%s,%s,%s,%s) RETURNING id, created_at",
            (user_id, int(receiver_id), int(listing_id), text)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'id': row[0], 'created_at': row[1].isoformat()})
        }

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}