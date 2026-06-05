-- Уникальность телефона только для непустых номеров,
-- чтобы несколько Telegram-пользователей без телефона могли существовать
ALTER TABLE itoni_users DROP CONSTRAINT IF EXISTS itoni_users_phone_key;
DROP INDEX IF EXISTS itoni_users_phone_key;
CREATE UNIQUE INDEX itoni_users_phone_uniq ON itoni_users (phone) WHERE phone <> '' AND phone IS NOT NULL;