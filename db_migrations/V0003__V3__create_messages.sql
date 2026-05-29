CREATE TABLE IF NOT EXISTS itoni_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES itoni_users(id),
  receiver_id INTEGER REFERENCES itoni_users(id),
  listing_id INTEGER REFERENCES itoni_listings(id),
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);