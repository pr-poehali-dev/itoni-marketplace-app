import json
import os
import base64
import uuid
import boto3

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Content-Type': 'application/json'
}

def handler(event: dict, context) -> dict:
    """Загрузка фотографий для объявлений в S3"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    user_id = event.get('headers', {}).get('X-User-Id')
    if not user_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

    body = {}
    raw_body = event.get('body')
    if raw_body:
        try:
            body = json.loads(raw_body)
        except (ValueError, TypeError):
            body = {}

    image_data = body.get('image')
    content_type = body.get('content_type', 'image/jpeg')

    if not image_data:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Нет изображения'})}

    # Только JPG/PNG
    ctype = (content_type or '').lower()
    if 'png' in ctype:
        ext = 'png'
    elif 'jpeg' in ctype or 'jpg' in ctype:
        ext = 'jpg'
    else:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неподдерживаемый формат (только JPG/PNG)'})}

    if ',' in image_data:
        image_data = image_data.split(',')[1]

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не удалось обработать файл, попробуйте другое фото'})}

    if len(image_bytes) > 5 * 1024 * 1024:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Фото слишком большое (макс. 5 МБ)'})}

    key = f"listings/{user_id}/{uuid.uuid4()}.{ext}"

    try:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
    except Exception as e:
        print('S3 upload error:', repr(e))
        return {'statusCode': 502, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сервер не принял фото, попробуйте ещё раз'})}

    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'success': True, 'url': url})
    }