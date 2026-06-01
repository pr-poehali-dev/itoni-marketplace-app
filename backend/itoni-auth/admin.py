import os
import json
import io
import csv

ADMIN_EMAIL = 'muratdzaurov@mail.ru'
ADMIN_PASSWORD = 'Dzaurov23061994'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Admin-Token',
    'Content-Type': 'application/json'
}

ADMIN_TOKEN = 'itoni-admin-ok'


def _resp(status, data):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(data, default=str)}


def _log(cur, action):
    cur.execute(
        "INSERT INTO itoni_admin_logs (admin_email, action) VALUES (%s, %s)",
        (ADMIN_EMAIL, action)
    )


def is_admin(event, body=None):
    headers = event.get('headers', {}) or {}
    token = (
        headers.get('X-Admin-Token')
        or headers.get('x-admin-token')
        or headers.get('X-ADMIN-TOKEN')
        or (body or {}).get('admin_token')
    )
    return token == ADMIN_TOKEN


def handle_admin(action, event, body, conn, cur):
    """Маршрутизация всех админских действий"""

    # Вход в админку
    if action == 'admin_login':
        email = (body.get('email') or '').strip().lower()
        password = (body.get('password') or '').strip()
        if email == ADMIN_EMAIL.lower() and password == ADMIN_PASSWORD:
            _log(cur, 'Вход в админ-панель')
            conn.commit()
            return _resp(200, {'success': True, 'token': ADMIN_TOKEN})
        return _resp(401, {'error': 'Неверный email или пароль'})

    # Все остальные требуют токен
    if not is_admin(event, body):
        return _resp(403, {'error': 'Доступ запрещён'})

    # ── РАЗДЕЛ 1. ПОЛЬЗОВАТЕЛИ ──
    if action == 'admin_users':
        search = (body.get('search') or '').strip()
        if search:
            like = f'%{search}%'
            cur.execute(
                """SELECT id, name, phone, city, region, created_at, is_blocked
                   FROM itoni_users
                   WHERE name ILIKE %s OR phone ILIKE %s
                   ORDER BY created_at DESC LIMIT 500""",
                (like, like)
            )
        else:
            cur.execute(
                """SELECT id, name, phone, city, region, created_at, is_blocked
                   FROM itoni_users ORDER BY created_at DESC LIMIT 500"""
            )
        rows = cur.fetchall()
        users = [{
            'id': r[0], 'name': r[1], 'phone': r[2], 'city': r[3],
            'region': r[4], 'created_at': r[5].isoformat() if r[5] else None,
            'is_blocked': r[6]
        } for r in rows]
        return _resp(200, {'users': users})

    if action == 'admin_block_user':
        uid = body.get('user_id')
        blocked = bool(body.get('blocked'))
        cur.execute("UPDATE itoni_users SET is_blocked=%s WHERE id=%s", (blocked, int(uid)))
        _log(cur, f'{"Заблокировал" if blocked else "Разблокировал"} пользователя #{uid}')
        conn.commit()
        return _resp(200, {'success': True})

    # ── РАЗДЕЛ 2. ОБЪЯВЛЕНИЯ ──
    if action == 'admin_listings':
        category = body.get('category')
        status = body.get('status')
        where = ['1=1']
        args = []
        if category:
            where.append('l.category=%s'); args.append(category)
        if status:
            where.append("COALESCE(l.status,'active')=%s"); args.append(status)
        cur.execute(
            f"""SELECT l.id, l.title, l.category, l.created_at, COALESCE(l.status,'active'),
                   l.reject_reason, u.name, u.phone, l.user_id, l.price
                FROM itoni_listings l
                LEFT JOIN itoni_users u ON u.id=l.user_id
                WHERE {' AND '.join(where)}
                ORDER BY l.created_at DESC LIMIT 500""",
            args
        )
        rows = cur.fetchall()
        listings = [{
            'id': r[0], 'title': r[1], 'category': r[2],
            'created_at': r[3].isoformat() if r[3] else None,
            'status': r[4], 'reject_reason': r[5], 'author': r[6], 'author_phone': r[7],
            'user_id': r[8], 'price': r[9]
        } for r in rows]
        return _resp(200, {'listings': listings})

    if action == 'admin_delete_listings':
        ids = body.get('ids') or []
        if not ids:
            return _resp(400, {'error': 'Не выбраны объявления'})
        ids = [int(i) for i in ids]
        cur.execute("DELETE FROM itoni_listings WHERE id = ANY(%s)", (ids,))
        _log(cur, f'Удалил объявления: {ids}')
        conn.commit()
        return _resp(200, {'success': True, 'deleted': len(ids)})

    if action == 'admin_reject_listing':
        lid = int(body.get('listing_id'))
        reason = (body.get('reason') or '').strip()
        cur.execute(
            "UPDATE itoni_listings SET status='rejected', reject_reason=%s WHERE id=%s",
            (reason, lid)
        )
        _log(cur, f'Отклонил объявление #{lid}: {reason}')
        conn.commit()
        return _resp(200, {'success': True})

    if action == 'admin_approve_listing':
        lid = int(body.get('listing_id'))
        cur.execute("UPDATE itoni_listings SET status='active', reject_reason=NULL WHERE id=%s", (lid,))
        _log(cur, f'Вернул в ленту объявление #{lid}')
        conn.commit()
        return _resp(200, {'success': True})

    # ── РАЗДЕЛ 3. ЖАЛОБЫ ──
    if action == 'admin_reports':
        cur.execute(
            """SELECT r.id, r.user_id, r.listing_id, r.reason, r.comment, r.created_at,
                      COALESCE(r.target_type,'listing'), r.target_user_id,
                      ru.name, l.title, l.user_id, tu.name
               FROM itoni_reports r
               LEFT JOIN itoni_users ru ON ru.id=r.user_id
               LEFT JOIN itoni_listings l ON l.id=r.listing_id
               LEFT JOIN itoni_users tu ON tu.id=r.target_user_id
               ORDER BY r.created_at DESC LIMIT 500"""
        )
        rows = cur.fetchall()
        reports = [{
            'id': r[0], 'reporter_id': r[1], 'listing_id': r[2], 'reason': r[3],
            'comment': r[4], 'created_at': r[5].isoformat() if r[5] else None,
            'target_type': r[6], 'target_user_id': r[7], 'reporter_name': r[8],
            'listing_title': r[9], 'listing_owner_id': r[10], 'target_user_name': r[11]
        } for r in rows]
        return _resp(200, {'reports': reports})

    # ── РАЗДЕЛ 4. СТАТИСТИКА ──
    if action == 'admin_stats':
        stats = {}
        cur.execute("SELECT COUNT(*) FROM itoni_users"); stats['users'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_listings"); stats['listings'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_messages"); stats['messages'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_reports"); stats['reports'] = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(views),0) FROM itoni_listings"); stats['views_total'] = cur.fetchone()[0]
        # активные пользователи по дате установки/создания
        cur.execute("SELECT COUNT(*) FROM itoni_users WHERE created_at::date = CURRENT_DATE"); stats['new_users_today'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_users WHERE created_at > NOW() - INTERVAL '7 days'"); stats['new_users_week'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_users WHERE created_at > NOW() - INTERVAL '30 days'"); stats['new_users_month'] = cur.fetchone()[0]
        # категории
        cur.execute("SELECT category, COUNT(*) FROM itoni_listings GROUP BY category")
        stats['by_category'] = {r[0]: r[1] for r in cur.fetchall()}
        return _resp(200, {'stats': stats})

    # ── РАЗДЕЛ 5. УСТАНОВКИ ──
    if action == 'admin_installs':
        cur.execute(
            """SELECT i.id, i.user_id, i.device_info, i.city, i.region, i.installed_at, u.name
               FROM itoni_installs i
               LEFT JOIN itoni_users u ON u.id=i.user_id
               ORDER BY i.installed_at DESC LIMIT 1000"""
        )
        rows = cur.fetchall()
        installs = [{
            'id': r[0], 'user_id': r[1], 'device_info': r[2], 'city': r[3],
            'region': r[4], 'installed_at': r[5].isoformat() if r[5] else None, 'user_name': r[6]
        } for r in rows]
        counts = {}
        cur.execute("SELECT COUNT(*) FROM itoni_installs"); counts['total'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_installs WHERE installed_at::date=CURRENT_DATE"); counts['today'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_installs WHERE installed_at > NOW() - INTERVAL '7 days'"); counts['week'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM itoni_installs WHERE installed_at > NOW() - INTERVAL '30 days'"); counts['month'] = cur.fetchone()[0]
        return _resp(200, {'installs': installs, 'counts': counts})

    if action == 'admin_installs_csv':
        cur.execute(
            """SELECT i.id, i.user_id, u.name, i.device_info, i.city, i.region, i.installed_at
               FROM itoni_installs i LEFT JOIN itoni_users u ON u.id=i.user_id
               ORDER BY i.installed_at DESC"""
        )
        rows = cur.fetchall()
        out = io.StringIO()
        w = csv.writer(out)
        w.writerow(['id', 'user_id', 'user_name', 'device_info', 'city', 'region', 'installed_at'])
        for r in rows:
            w.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6].isoformat() if r[6] else ''])
        return _resp(200, {'csv': out.getvalue()})

    # ── РАЗДЕЛ 6. БАННЕРЫ ──
    if action == 'admin_banners':
        cur.execute("SELECT id, title, image_url, link_url, is_active, position, created_at FROM itoni_banners ORDER BY position ASC, id DESC")
        rows = cur.fetchall()
        banners = [{
            'id': r[0], 'title': r[1], 'image_url': r[2], 'link_url': r[3],
            'is_active': r[4], 'position': r[5], 'created_at': r[6].isoformat() if r[6] else None
        } for r in rows]
        return _resp(200, {'banners': banners})

    if action == 'admin_banner_save':
        bid = body.get('id')
        title = body.get('title')
        image_url = body.get('image_url')
        link_url = body.get('link_url')
        position = int(body.get('position') or 0)
        is_active = bool(body.get('is_active', True))
        if bid:
            cur.execute(
                "UPDATE itoni_banners SET title=%s, image_url=%s, link_url=%s, position=%s, is_active=%s WHERE id=%s",
                (title, image_url, link_url, position, is_active, int(bid))
            )
            _log(cur, f'Изменил баннер #{bid}')
        else:
            cur.execute(
                "INSERT INTO itoni_banners (title, image_url, link_url, position, is_active) VALUES (%s,%s,%s,%s,%s)",
                (title, image_url, link_url, position, is_active)
            )
            _log(cur, 'Добавил баннер')
        conn.commit()
        return _resp(200, {'success': True})

    if action == 'admin_banner_toggle':
        bid = int(body.get('id'))
        cur.execute("UPDATE itoni_banners SET is_active = NOT is_active WHERE id=%s", (bid,))
        conn.commit()
        return _resp(200, {'success': True})

    if action == 'admin_banner_delete':
        bid = int(body.get('id'))
        cur.execute("DELETE FROM itoni_banners WHERE id=%s", (bid,))
        _log(cur, f'Удалил баннер #{bid}')
        conn.commit()
        return _resp(200, {'success': True})

    # ── РАЗДЕЛ 7. ТЕКСТЫ НА ГЛАВНОЙ ──
    if action == 'admin_home_content':
        cur.execute("SELECT id, section, content, is_active FROM itoni_home_content ORDER BY id ASC")
        rows = cur.fetchall()
        items = [{'id': r[0], 'section': r[1], 'content': r[2], 'is_active': r[3]} for r in rows]
        return _resp(200, {'content': items})

    if action == 'admin_home_content_save':
        cid = body.get('id')
        content = body.get('content')
        is_active = bool(body.get('is_active', True))
        if cid:
            cur.execute("UPDATE itoni_home_content SET content=%s, is_active=%s WHERE id=%s", (content, is_active, int(cid)))
            _log(cur, f'Изменил текст главной #{cid}')
        else:
            cur.execute("INSERT INTO itoni_home_content (section, content, is_active) VALUES (%s,%s,%s)",
                        (body.get('section') or 'custom', content, is_active))
            _log(cur, 'Добавил текст главной')
        conn.commit()
        return _resp(200, {'success': True})

    # ── РАЗДЕЛ 8. РАССЫЛКА ──
    if action == 'admin_broadcast':
        title = (body.get('title') or '').strip()[:60]
        text = (body.get('body') or '').strip()[:200]
        kind = body.get('kind') or 'info'
        if not title or not text:
            return _resp(400, {'error': 'Заполните заголовок и текст'})
        cur.execute("INSERT INTO itoni_broadcasts (title, body, kind) VALUES (%s,%s,%s)", (title, text, kind))
        cur.execute("SELECT id FROM itoni_users")
        user_ids = [r[0] for r in cur.fetchall()]
        for uid in user_ids:
            cur.execute(
                "INSERT INTO itoni_notifications (user_id, type, title, body) VALUES (%s,'system',%s,%s)",
                (uid, title, text)
            )
        _log(cur, f'Отправил рассылку «{title}» ({len(user_ids)} получателей)')
        conn.commit()
        return _resp(200, {'success': True, 'sent': len(user_ids)})

    if action == 'admin_broadcasts':
        cur.execute("SELECT id, title, body, kind, created_at FROM itoni_broadcasts ORDER BY created_at DESC LIMIT 200")
        rows = cur.fetchall()
        items = [{'id': r[0], 'title': r[1], 'body': r[2], 'kind': r[3], 'created_at': r[4].isoformat() if r[4] else None} for r in rows]
        return _resp(200, {'broadcasts': items})

    # ── РАЗДЕЛ 9. КАТЕГОРИИ ──
    if action == 'admin_categories':
        cur.execute("SELECT id, slug, name, icon, sort_order, is_active FROM itoni_categories ORDER BY sort_order ASC, id ASC")
        rows = cur.fetchall()
        cats = [{'id': r[0], 'slug': r[1], 'name': r[2], 'icon': r[3], 'sort_order': r[4], 'is_active': r[5]} for r in rows]
        return _resp(200, {'categories': cats})

    if action == 'admin_category_save':
        cid = body.get('id')
        name = body.get('name')
        icon = body.get('icon')
        slug = body.get('slug')
        sort_order = int(body.get('sort_order') or 0)
        is_active = bool(body.get('is_active', True))
        if cid:
            cur.execute("UPDATE itoni_categories SET name=%s, icon=%s, sort_order=%s, is_active=%s WHERE id=%s",
                        (name, icon, sort_order, is_active, int(cid)))
            _log(cur, f'Изменил категорию #{cid}')
        else:
            if not slug:
                slug = (name or 'cat').lower().replace(' ', '_')
            cur.execute("INSERT INTO itoni_categories (slug, name, icon, sort_order, is_active) VALUES (%s,%s,%s,%s,%s) ON CONFLICT (slug) DO NOTHING",
                        (slug, name, icon, sort_order, is_active))
            _log(cur, f'Добавил категорию {name}')
        conn.commit()
        return _resp(200, {'success': True})

    if action == 'admin_category_toggle':
        cid = int(body.get('id'))
        cur.execute("UPDATE itoni_categories SET is_active = NOT is_active WHERE id=%s", (cid,))
        conn.commit()
        return _resp(200, {'success': True})

    # ── РАЗДЕЛ 10. МАРКИ ──
    if action == 'admin_brands':
        category_id = body.get('category_id')
        if category_id:
            cur.execute("SELECT id, category_id, name, is_active FROM itoni_brands WHERE category_id=%s ORDER BY name ASC", (int(category_id),))
        else:
            cur.execute("SELECT id, category_id, name, is_active FROM itoni_brands ORDER BY name ASC")
        rows = cur.fetchall()
        brands = [{'id': r[0], 'category_id': r[1], 'name': r[2], 'is_active': r[3]} for r in rows]
        return _resp(200, {'brands': brands})

    if action == 'admin_brand_add':
        category_id = int(body.get('category_id'))
        name = (body.get('name') or '').strip()
        if not name:
            return _resp(400, {'error': 'Укажите название марки'})
        cur.execute("INSERT INTO itoni_brands (category_id, name) VALUES (%s,%s)", (category_id, name))
        _log(cur, f'Добавил марку {name}')
        conn.commit()
        return _resp(200, {'success': True})

    if action == 'admin_brand_delete':
        bid = int(body.get('id'))
        cur.execute("SELECT name FROM itoni_brands WHERE id=%s", (bid,))
        row = cur.fetchone()
        if not row:
            return _resp(404, {'error': 'Марка не найдена'})
        cur.execute("SELECT COUNT(*) FROM itoni_listings WHERE brand=%s", (row[0],))
        if cur.fetchone()[0] > 0:
            return _resp(400, {'error': 'На эту марку есть объявления, удалить нельзя'})
        cur.execute("DELETE FROM itoni_brands WHERE id=%s", (bid,))
        _log(cur, f'Удалил марку #{bid}')
        conn.commit()
        return _resp(200, {'success': True})

    # ── РАЗДЕЛ 11. ЛОГИ АДМИНА ──
    if action == 'admin_logs':
        date_from = body.get('date_from')
        if date_from:
            cur.execute("SELECT id, admin_email, action, created_at FROM itoni_admin_logs WHERE created_at::date >= %s ORDER BY created_at DESC LIMIT 1000", (date_from,))
        else:
            cur.execute("SELECT id, admin_email, action, created_at FROM itoni_admin_logs ORDER BY created_at DESC LIMIT 1000")
        rows = cur.fetchall()
        logs = [{'id': r[0], 'admin_email': r[1], 'action': r[2], 'created_at': r[3].isoformat() if r[3] else None} for r in rows]
        return _resp(200, {'logs': logs})

    return _resp(404, {'error': 'Неизвестное админ-действие'})