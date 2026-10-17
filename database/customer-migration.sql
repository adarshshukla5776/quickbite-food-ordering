-- QuickBite v3: safe, additive migration for the existing Neon database.
-- IMPORTANT: Run this file only. Do NOT drop tables or re-run schema.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id, created_at DESC);
CREATE TABLE IF NOT EXISTS customer_auth_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_auth_attempts ON customer_auth_attempts(key_hash, attempted_at);
COMMIT;
