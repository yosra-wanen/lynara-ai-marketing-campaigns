-- Migration 00004 : Admin Panel — logs, instagram_accounts, settings
BEGIN;

-- ─── admin_logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT        NOT NULL,
  target_user   UUID,
  performed_by  UUID        NOT NULL,
  details       JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_performed_by ON admin_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at   ON admin_logs(created_at DESC);

-- ─── instagram_accounts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id          UUID        REFERENCES core.companies(company_id) ON DELETE CASCADE,
  instagram_user_id   TEXT        NOT NULL UNIQUE,
  username            TEXT        NOT NULL,
  access_token        TEXT,
  follower_count      INTEGER     NOT NULL DEFAULT 0,
  is_connected        BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_user_id    ON instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_company_id ON instagram_accounts(company_id);

-- ─── settings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('platform_name',     '"Lynara AI"'),
  ('maintenance_mode',  'false')
ON CONFLICT (key) DO NOTHING;

COMMIT;
