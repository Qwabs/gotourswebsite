-- schema.sql
-- Run once to create the tours_db database and all tables.
-- Usage: mysql -u root -p < schema.sql

-- ─── Database ─────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS tours_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tours_db;

-- ─── Tours ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tours (
  id          INT           NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(100)  NOT NULL UNIQUE,          -- e.g. "grand-canyon"
  name        VARCHAR(150)  NOT NULL,
  duration    VARCHAR(50)   NOT NULL,                 -- e.g. "3 days"
  price       DECIMAL(10,2) NOT NULL,
  description TEXT,
  image       VARCHAR(255),
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash VARCHAR(255),                         -- store hashed passwords only
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id           INT            NOT NULL AUTO_INCREMENT,
  tour_id      INT            NOT NULL,
  user_id      INT,                                   -- NULL if guest checkout
  guest_name   VARCHAR(100)   NOT NULL,
  email        VARCHAR(150)   NOT NULL,
  phone        VARCHAR(30),
  guests       INT            NOT NULL DEFAULT 1,
  start_date   DATE           NOT NULL,
  base_total   DECIMAL(10,2)  NOT NULL,
  discount     DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  total        DECIMAL(10,2)  NOT NULL,
  booked_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_booking_tour FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE RESTRICT,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_bookings_tour    ON bookings (tour_id);
CREATE INDEX idx_bookings_email   ON bookings (email);
CREATE INDEX idx_bookings_date    ON bookings (start_date);

-- ─── Seed Data — Tours ────────────────────────────────────────────────────────

INSERT INTO tours (slug, name, duration, price, description, image) VALUES
  ('grand-canyon',    'Grand Canyon Explorer',          '3 days', 249.00,  'Guided hiking with national park entry, 2 nights lodge, meals.',                              'https://via.placeholder.com/300x200?text=Grand+Canyon'),
  ('safari-sunrise',  'Safari Sunrise',                 '5 days', 825.00,  'Full safari experience with professional guide, tents, all terrain vehicle.',                 'https://via.placeholder.com/300x200?text=Safari+Sunrise'),
  ('island-getaway',  'Island Getaway',                 '4 days', 680.00,  'Beach resort stay, island hopping and snorkeling package.',                                   'https://via.placeholder.com/300x200?text=Island+Getaway'),
  ('northern-lights', 'Northern Lights Adventure',      '6 days', 1199.00, 'Aurora viewing, cozy cabin, expert photographer coach.',                                      'https://via.placeholder.com/300x200?text=Northern+Lights'),
  ('alps-hiking',     'Alps Hiking Adventure',          '7 days', 950.00,  'Scenic hikes in the Swiss Alps with mountain guides and chalet stays.',                       'https://via.placeholder.com/300x200?text=Alps+Hiking'),
  ('amazon',          'Amazon Rainforest Expedition',   '5 days', 720.00,  'Explore the Amazon with indigenous guides, wildlife spotting, and eco-lodges.',               'https://via.placeholder.com/300x200?text=Amazon+Rainforest'),
  ('great-wall',      'Great Wall Trek',                '4 days', 550.00,  'Walk the ancient Great Wall of China with cultural insights and Beijing tours.',              'https://via.placeholder.com/300x200?text=Great+Wall')
ON DUPLICATE KEY UPDATE name = VALUES(name);   -- safe to re-run
