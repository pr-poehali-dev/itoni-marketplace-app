-- Блокировка пользователей
ALTER TABLE itoni_users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Статус объявлений (отклонение модерацией)
ALTER TABLE itoni_listings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE itoni_listings ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- Жалобы: поддержка жалоб на пользователей
ALTER TABLE itoni_reports ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) DEFAULT 'listing';
ALTER TABLE itoni_reports ADD COLUMN IF NOT EXISTS target_user_id INTEGER;

-- Установки приложения
CREATE TABLE IF NOT EXISTS itoni_installs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    device_info TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    installed_at TIMESTAMP DEFAULT NOW()
);

-- Баннеры
CREATE TABLE IF NOT EXISTS itoni_banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Тексты на главной
CREATE TABLE IF NOT EXISTS itoni_home_content (
    id SERIAL PRIMARY KEY,
    section VARCHAR(50) NOT NULL,
    content TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Категории
CREATE TABLE IF NOT EXISTS itoni_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Марки
CREATE TABLE IF NOT EXISTS itoni_brands (
    id SERIAL PRIMARY KEY,
    category_id INTEGER,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Логи администратора
CREATE TABLE IF NOT EXISTS itoni_admin_logs (
    id SERIAL PRIMARY KEY,
    admin_email VARCHAR(150),
    action TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- История рассылок
CREATE TABLE IF NOT EXISTS itoni_broadcasts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    body VARCHAR(300),
    kind VARCHAR(30) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Сидинг категорий из текущих фиксированных
INSERT INTO itoni_categories (slug, name, icon, sort_order, is_active) VALUES
('auto', 'Авто', '🚗', 1, TRUE),
('moto', 'Мото', '🏍️', 2, TRUE),
('boats', 'Лодки', '⛵', 3, TRUE),
('parts', 'Запчасти', '🔧', 4, TRUE),
('special', 'Спецтехника', '🚜', 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Сидинг текстов главной
INSERT INTO itoni_home_content (section, content, is_active) VALUES
('greeting', 'Продай или купи за пару минут', TRUE),
('promo', 'Маркетплейс техники', TRUE),
('footer', 'иТони — маркетплейс авто и техники', TRUE)
ON CONFLICT DO NOTHING;