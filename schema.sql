-- Схема базы данных для туров BerúPeru

-- Таблица туров
CREATE TABLE IF NOT EXISTS tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  group_size VARCHAR(50),
  includes TEXT,
  language VARCHAR(50) DEFAULT 'русский',
  url VARCHAR(500) NOT NULL UNIQUE,
  image_url VARCHAR(500),
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_location ON tours(location);
CREATE INDEX IF NOT EXISTS idx_category ON tours(category);
CREATE INDEX IF NOT EXISTS idx_price ON tours(price);
CREATE INDEX IF NOT EXISTS idx_title ON tours(title);
CREATE INDEX IF NOT EXISTS idx_active ON tours(is_active);

-- Таблица для сохранения поисковых запросов (для аналитики)
CREATE TABLE IF NOT EXISTS search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  query TEXT NOT NULL,
  results_count INTEGER,
  selected_tour_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (selected_tour_id) REFERENCES tours(id)
);

-- Таблица для сохранения избранных туров пользователя
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tour_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES tours(id),
  UNIQUE(user_id, tour_id)
);

-- Таблица для бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_phone VARCHAR(20),
  tour_id INTEGER NOT NULL,
  booking_date DATE,
  group_size INTEGER,
  total_price DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES tours(id)
);

-- Таблица для метаданных БД
CREATE TABLE IF NOT EXISTS metadata (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем начальные метаданные
INSERT OR IGNORE INTO metadata (key, value)
VALUES ('last_parse', '2024-01-01 00:00:00');

INSERT OR IGNORE INTO metadata (key, value)
VALUES ('total_tours', '0');
