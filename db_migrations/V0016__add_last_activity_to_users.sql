ALTER TABLE itoni_users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITHOUT TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON itoni_favorites(listing_id);