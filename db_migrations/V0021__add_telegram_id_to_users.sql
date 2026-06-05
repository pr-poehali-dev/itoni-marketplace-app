ALTER TABLE itoni_users ADD COLUMN IF NOT EXISTS telegram_id BIGINT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_itoni_users_telegram_id ON itoni_users (telegram_id) WHERE telegram_id IS NOT NULL;