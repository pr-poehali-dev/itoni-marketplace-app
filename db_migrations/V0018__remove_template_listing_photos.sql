-- Удаляем шаблонное (демо) фото из старых объявлений.
-- Все объявления, у которых стоит общая заглушка 2291a7e5-..., очищаем — фото будет показано как нейтральная иконка.
UPDATE itoni_listings
SET images = NULL
WHERE images IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM unnest(images) AS img
    WHERE img LIKE '%2291a7e5-3513-4003-9ec3-c753a61b4a28%'
  );