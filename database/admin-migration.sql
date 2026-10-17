-- QuickBite v2 add-on. SAFE on an existing QuickBite Neon database.
-- Run this once in Neon's SQL Editor. Does NOT delete or change existing orders, products or customers.
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key_hash CHAR(64) NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_attempts_recent ON admin_login_attempts(key_hash, attempted_at);
-- Maintenance (optional, run occasionally):
-- DELETE FROM admin_login_attempts WHERE attempted_at < NOW() - INTERVAL '2 days';
