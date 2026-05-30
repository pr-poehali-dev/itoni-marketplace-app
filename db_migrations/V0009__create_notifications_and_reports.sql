CREATE TABLE IF NOT EXISTS itoni_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    listing_id INTEGER,
    sender_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON itoni_notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS itoni_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON itoni_reports(listing_id);