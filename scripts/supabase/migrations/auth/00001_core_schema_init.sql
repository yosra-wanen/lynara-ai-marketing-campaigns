-- Migration 00001 : Schéma core (auth, profils, entreprises)
-- À exécuter sur un projet Supabase (Auth déjà disponible).
-- Pas de dépendance RH. Fournisseurs IA en enum. Statuts d'invitation en enum.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schéma
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS core;

-- -----------------------------------------------------------------------------
-- 2. Fonction updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION core.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Enums
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_member_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.company_member_role AS ENUM (
      'owner', 'admin', 'member', 'billing', 'invoicing', 'viewer'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_member_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.company_member_status AS ENUM (
      'active', 'inactive', 'pending', 'invited', 'disabled'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.invite_status AS ENUM (
      'pending', 'accepted', 'expired', 'revoked'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_target_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.invite_target_type AS ENUM ('company');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_provider' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.ai_provider AS ENUM (
      'openai', 'anthropic', 'openrouter', 'replicate', 'stability', 'runway', 'other'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_user' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.type_user AS ENUM ('merchant', 'accountant', 'both', 'employee');
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- 4. Table core.profiles (lié à auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.profiles (
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  type_user core.type_user,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_admin boolean NOT NULL DEFAULT false,
  subscription jsonb NOT NULL DEFAULT '{}',
  sub_related_to uuid,
  stripe_subscription jsonb NOT NULL DEFAULT '{}',
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_sub_related_to_fkey FOREIGN KEY (sub_related_to) REFERENCES core.profiles(user_id) ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'core' AND table_name = 'profiles' AND constraint_name = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE core.profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END$$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON core.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_sub_related_to ON core.profiles(sub_related_to) WHERE sub_related_to IS NOT NULL;

CREATE TRIGGER trg_set_updated_at_profiles
  BEFORE UPDATE ON core.profiles
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Table core.companies (sans dépendance accountants/HR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.companies (
  company_id uuid NOT NULL DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  registration_no text,
  country text NOT NULL DEFAULT 'FR',
  currency text NOT NULL DEFAULT 'EUR',
  vat_number text,
  email text,
  phone text,
  siret_number text,
  naf_code text,
  industry text,
  activity_description text,
  settings jsonb NOT NULL DEFAULT '{"vat_regime": "standard", "decimal_places": 3, "fiscal_year_start": 1, "invoice_numbering": "yearly"}',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  parent_company_id uuid,
  primary_address_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (company_id),
  CONSTRAINT companies_parent_company_id_fkey FOREIGN KEY (parent_company_id) REFERENCES core.companies(company_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_siret_unique ON core.companies(siret_number) WHERE siret_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_vat_unique ON core.companies(vat_number) WHERE vat_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_country ON core.companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON core.companies(is_active);

CREATE TRIGGER trg_set_updated_at_companies
  BEFORE UPDATE ON core.companies
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Table core.addresses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.addresses (
  address_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal_code text,
  country text NOT NULL,
  is_billing boolean NOT NULL DEFAULT false,
  is_shipping boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (address_id),
  CONSTRAINT addresses_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(company_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_addresses_company_id ON core.addresses(company_id);

-- Lien optionnel companies.primary_address_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'core' AND table_name = 'companies' AND constraint_name = 'companies_primary_address_id_fkey'
  ) THEN
    ALTER TABLE core.companies
      ADD CONSTRAINT companies_primary_address_id_fkey
      FOREIGN KEY (primary_address_id) REFERENCES core.addresses(address_id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END$$;

-- -----------------------------------------------------------------------------
-- 7. Table core.company_members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.company_members (
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role core.company_member_role NOT NULL,
  status core.company_member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_members_pkey PRIMARY KEY (company_id, user_id),
  CONSTRAINT company_members_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(company_id) ON DELETE CASCADE,
  CONSTRAINT company_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES core.profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON core.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON core.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON core.company_members(status);

CREATE TRIGGER trg_set_updated_at_company_members
  BEFORE UPDATE ON core.company_members
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. Table core.invites (statut en enum)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.invites (
  invite_id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  target_type core.invite_target_type NOT NULL DEFAULT 'company',
  target_id uuid NOT NULL,
  role core.company_member_role NOT NULL,
  invited_by uuid,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  status core.invite_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invites_pkey PRIMARY KEY (invite_id),
  CONSTRAINT invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES core.profiles(user_id) ON DELETE SET NULL,
  CONSTRAINT invites_target_id_fkey FOREIGN KEY (target_id) REFERENCES core.companies(company_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invites_email ON core.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON core.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_target ON core.invites(target_type, target_id);

COMMIT;
