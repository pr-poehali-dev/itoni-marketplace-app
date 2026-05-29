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
    """Избранное: добавление, удаление и получение избранных объявлений"""
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

    user_id = event.get('headers', {}).get('X-User-Id')
    if not user_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
    user_id = int(user_id)

    conn = get_conn()
    cur = conn.cursor()

    # GET - список избранного
    if method == 'GET':
        cur.execute(
            """SELECT l.id, l.title, l.price, l.category, l.brand, l.model,
               l.year, l.mileage, l.city, l.images, l.views, l.created_at,
               u.name, u.photo
               FROM itoni_favorites f
               JOIN itoni_listings l ON l.id = f.listing_id
               LEFT JOIN itoni_users u ON u.id = l.user_id
               WHERE f.user_id=%s AND l.is_active=TRUE AND f.is_active=TRUE
               ORDER BY f.created_at DESC""",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()

        listings = [{
            'id': r[0], 'title': r[1], 'price': r[2], 'category': r[3],
            'brand': r[4], 'model': r[5], 'year': r[6], 'mileage': r[7],
            'city': r[8], 'images': list(r[9]) if r[9] else [],
            'views': r[10], 'created_at': r[11].isoformat() if r[11] else None,
            'seller_name': r[12], 'seller_photo': r[13]
        } for r in rows]

        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'favorites': listings})}

    # POST - добавить/переключить избранное
    if method == 'POST':
        listing_id = body.get('listing_id')
        if not listing_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите listing_id'})}

        listing_id = int(listing_id)

        # Проверим, есть ли уже запись
        cur.execute(
            "SELECT id, is_active FROM itoni_favorites WHERE user_id=%s AND listing_id=%s",
            (user_id, listing_id)
        )
        existing = cur.fetchone()

        if existing:
            # Если уже есть — переключаем
            new_state = not existing[1]
            cur.execute(
                "UPDATE itoni_favorites SET is_active=%s WHERE id=%s",
                (new_state, existing[0])
            )
            conn.commit()
            cur.close(); conn.close()
            action = 'added' if new_state else 'removed'
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'action': action})}
        else:
            cur.execute(
                "INSERT INTO itoni_favorites (user_id, listing_id, is_active) VALUES (%s,%s,TRUE)",
                (user_id, listing_id)
            )
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'action': 'added'})}

    # DELETE - убрать из избранного (soft delete через UPDATE)
    if method == 'DELETE':
        listing_id = body.get('listing_id')
        if not listing_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите listing_id'})}

        cur.execute(
            "UPDATE itoni_favorites SET is_active=FALSE WHERE user_id=%s AND listing_id=%s",
            (user_id, int(listing_id))
        )
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'action': 'removed'})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}