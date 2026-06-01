ALTER TABLE itoni_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE itoni_users ADD COLUMN IF NOT EXISTS login VARCHAR(100);
ALTER TABLE itoni_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE itoni_users ALTER COLUMN phone SET DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS itoni_users_login_uniq ON itoni_users (LOWER(login)) WHERE login IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS itoni_users_email_uniq ON itoni_users (LOWER(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS itoni_email_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS itoni_email_codes_email_idx ON itoni_email_codes (email);