CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TYPE property_type AS ENUM ('apartment', 'villa', 'plot', 'commercial');

CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE TABLE properties (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL,        -- store in lowercase
  locality    TEXT NOT NULL,
  type        property_type NOT NULL,
  price       BIGINT NOT NULL CHECK (price >= 0),
  bedrooms    SMALLINT NOT NULL CHECK (bedrooms >= 0),
  status      TEXT NOT NULL DEFAULT 'active' CONSTRAINT properties_status_check CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE INDEX idx_city_price    ON properties (city, price, id) WHERE status = 'active';
CREATE INDEX idx_city_newest   ON properties (city, created_at DESC, id DESC) WHERE status = 'active';
CREATE INDEX idx_similar       ON properties (city, type, price) WHERE status = 'active';
CREATE INDEX idx_owner         ON properties (owner_id);
CREATE INDEX idx_locality_trgm ON properties USING gin (locality gin_trgm_ops);

CREATE TABLE property_images (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  position    SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (property_id, position)
);

CREATE TABLE refresh_tokens (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id  UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ(3) NOT NULL,
  revoked_at TIMESTAMPTZ(3),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_family ON refresh_tokens (family_id);
CREATE INDEX idx_refresh_user   ON refresh_tokens (user_id);

CREATE TABLE inquiries (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  sender_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 1000),
  created_at  TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  UNIQUE (property_id, sender_id)
);

CREATE INDEX idx_inquiries_sender ON inquiries (sender_id);
