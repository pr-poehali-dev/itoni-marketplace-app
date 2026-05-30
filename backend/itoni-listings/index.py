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

def listing_to_dict(row):
    return {
        'id': row[0],
        'user_id': row[1],
        'title': row[2],
        'description': row[3],
        'price': row[4],
        'category': row[5],
        'brand': row[6],
        'model': row[7],
        'year': row[8],
        'mileage': row[9],
        'fuel_type': row[10],
        'transmission': row[11],
        'city': row[12],
        'region': row[13],
        'images': list(row[14]) if row[14] else [],
        'views': row[15],
        'created_at': row[16].isoformat() if row[16] else None,
        'seller_name': row[17],
        'seller_phone': row[18],
        'seller_photo': row[19]
    }

def handler(event: dict, context) -> dict:
    """CRUD объявлений: получение, создание, обновление объявлений"""
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

    conn = get_conn()
    cur = conn.cursor()

    # GET ?id={id} - получить одно объявление
    if method == 'GET' and params.get('id'):
        listing_id = int(params['id'])
        cur.execute(
            """SELECT l.id, l.user_id, l.title, l.description, l.price, l.category,
               l.brand, l.model, l.year, l.mileage, l.fuel_type, l.transmission,
               l.city, l.region, l.images, l.views, l.created_at,
               u.name, u.phone, u.photo
               FROM itoni_listings l
               LEFT JOIN itoni_users u ON u.id = l.user_id
               WHERE l.id=%s AND l.is_active=TRUE""",
            (listing_id,)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не найдено'})}

        cur.execute("UPDATE itoni_listings SET views = views + 1 WHERE id=%s", (listing_id,))

        # Уведомление владельцу о просмотре (не чаще 1 раза в час, не себе)
        viewer_id = event.get('headers', {}).get('X-User-Id')
        owner_id = row[1]
        if viewer_id and int(viewer_id) != owner_id:
            cur.execute(
                """SELECT id FROM itoni_notifications
                   WHERE user_id=%s AND type='view' AND listing_id=%s
                   AND created_at > NOW() - INTERVAL '1 hour'
                   LIMIT 1""",
                (owner_id, listing_id)
            )
            recent = cur.fetchone()
            if not recent:
                cur.execute(
                    "INSERT INTO itoni_notifications (user_id, type, title, body, listing_id) VALUES (%s,%s,%s,%s,%s)",
                    (owner_id, 'view', 'Новый просмотр объявления',
                     f'Ваше объявление «{row[2]}» просмотрели', listing_id)
                )

        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(listing_to_dict(row))}

    # GET / - список объявлений
    if method == 'GET':
        category = params.get('category')
        search = params.get('search')
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        min_year = params.get('min_year')
        max_year = params.get('max_year')
        city = params.get('city')
        region = params.get('region')
        fuel_type = params.get('fuel_type')
        transmission = params.get('transmission')
        min_mileage = params.get('min_mileage')
        max_mileage = params.get('max_mileage')
        user_id = params.get('user_id')
        limit = int(params.get('limit', 20))
        offset = int(params.get('offset', 0))

        where = ["l.is_active=TRUE"]
        args = []

        # В общей ленте скрываем отклонённые модерацией; в "Мои объявления" (user_id) показываем все
        if not user_id:
            where.append("COALESCE(l.status,'active') = 'active'")

        if category:
            where.append("l.category=%s"); args.append(category)
        if search:
            where.append("(l.title ILIKE %s OR l.brand ILIKE %s OR l.model ILIKE %s)")
            args += [f'%{search}%', f'%{search}%', f'%{search}%']
        if min_price:
            where.append("l.price >= %s"); args.append(int(min_price))
        if max_price:
            where.append("l.price <= %s"); args.append(int(max_price))
        if min_year:
            where.append("l.year >= %s"); args.append(int(min_year))
        if max_year:
            where.append("l.year <= %s"); args.append(int(max_year))
        if min_mileage:
            where.append("l.mileage >= %s"); args.append(int(min_mileage))
        if max_mileage:
            where.append("l.mileage <= %s"); args.append(int(max_mileage))
        if fuel_type:
            where.append("l.fuel_type=%s"); args.append(fuel_type)
        if transmission:
            where.append("l.transmission=%s"); args.append(transmission)
        if city:
            where.append("l.city=%s"); args.append(city)
        if region:
            where.append("l.region=%s"); args.append(region)
        if user_id:
            where.append("l.user_id=%s"); args.append(int(user_id))

        where_clause = ' AND '.join(where)
        args += [limit, offset]

        cur.execute(
            f"""SELECT l.id, l.user_id, l.title, l.description, l.price, l.category,
               l.brand, l.model, l.year, l.mileage, l.fuel_type, l.transmission,
               l.city, l.region, l.images, l.views, l.created_at,
               u.name, u.phone, u.photo
               FROM itoni_listings l
               LEFT JOIN itoni_users u ON u.id = l.user_id
               WHERE {where_clause}
               ORDER BY l.created_at DESC
               LIMIT %s OFFSET %s""",
            args
        )
        rows = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) FROM itoni_listings l WHERE {where_clause}", args[:-2])
        total = cur.fetchone()[0]

        cur.close(); conn.close()
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'listings': [listing_to_dict(r) for r in rows], 'total': total})
        }

    # POST ?action=report - пожаловаться на объявление
    if method == 'POST' and body.get('action') == 'report':
        user_id = event.get('headers', {}).get('X-User-Id')
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
        listing_id = body.get('listing_id')
        reason = (body.get('reason') or '').strip()
        if not listing_id or not reason:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите объявление и причину'})}
        cur.execute(
            "INSERT INTO itoni_reports (user_id, listing_id, reason, comment) VALUES (%s,%s,%s,%s)",
            (int(user_id), int(listing_id), reason, body.get('comment'))
        )
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # POST / - создать объявление
    if method == 'POST':
        user_id = event.get('headers', {}).get('X-User-Id')
        if not user_id:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

        cur.execute("SELECT is_blocked FROM itoni_users WHERE id=%s", (int(user_id),))
        urow = cur.fetchone()
        if urow and urow[0]:
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Ваш аккаунт заблокирован администратором'})}

        required = ['title', 'price', 'category']
        for f in required:
            if not body.get(f):
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Поле {f} обязательно'})}

        images = body.get('images', [])

        cur.execute(
            """INSERT INTO itoni_listings
               (user_id, title, description, price, category, brand, model, year, mileage,
               fuel_type, transmission, city, region, images)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               RETURNING id""",
            (
                int(user_id),
                body['title'],
                body.get('description'),
                int(body['price']),
                body['category'],
                body.get('brand'),
                body.get('model'),
                body.get('year'),
                body.get('mileage'),
                body.get('fuel_type'),
                body.get('transmission'),
                body.get('city'),
                body.get('region'),
                images if images else None
            )
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'id': new_id})}

    # DELETE / - удалить своё объявление
    if method == 'DELETE':
        user_id = event.get('headers', {}).get('X-User-Id')
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

        listing_id = body.get('id') or (params.get('id') if params else None)
        if not listing_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Укажите id объявления'})}

        cur.execute(
            "DELETE FROM itoni_listings WHERE id=%s AND user_id=%s RETURNING id",
            (int(listing_id), int(user_id))
        )
        deleted = cur.fetchone()
        cur.execute("DELETE FROM itoni_favorites WHERE listing_id=%s", (int(listing_id),))
        conn.commit()
        cur.close(); conn.close()

        if not deleted:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Объявление не найдено'})}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}