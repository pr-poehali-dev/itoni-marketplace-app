CREATE TABLE IF NOT EXISTS itoni_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES itoni_users(id),
  listing_id INTEGER REFERENCES itoni_listings(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS itoni_sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);