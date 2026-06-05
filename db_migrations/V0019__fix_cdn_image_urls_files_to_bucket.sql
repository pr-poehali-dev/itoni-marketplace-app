-- Исправляем битый путь в URL загруженных фото: /files/listings/ -> /bucket/listings/
-- Объявления
UPDATE itoni_listings
SET images = (
  SELECT array_agg(replace(img, '/files/listings/', '/bucket/listings/'))
  FROM unnest(images) AS img
)
WHERE images IS NOT NULL
  AND EXISTS (SELECT 1 FROM unnest(images) AS img WHERE img LIKE '%/files/listings/%');

-- Аватары пользователей
UPDATE itoni_users
SET photo = replace(photo, '/files/listings/', '/bucket/listings/')
WHERE photo LIKE '%/files/listings/%';