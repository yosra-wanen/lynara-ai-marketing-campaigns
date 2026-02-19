-- Migration 00002 : Abonnements (formules évolutives) + Config AI (clés par fournisseur, enum)
-- Dépend de 00001_core_schema_init.sql

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Formules d'abonnement (scalable : features + limits en jsonb)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.subscription_plans (
  plan_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (plan_id),
  CONSTRAINT subscription_plans_slug_key UNIQUE (slug)
);

COMMENT ON COLUMN core.subscription_plans.features IS 'Liste de fonctionnalités activées, ex: ["chatbot", "image_creation", "video_creation"]';
COMMENT ON COLUMN core.subscription_plans.limits IS 'Quotas par service, ex: {"image_tokens": 8000, "video_minutes": 10} ou {} si illimité selon formule';

-- -----------------------------------------------------------------------------
-- 2. Abonnement par entreprise (une entreprise = une formule courante)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.company_subscriptions (
  company_id uuid NOT NULL,
  plan_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_subscriptions_pkey PRIMARY KEY (company_id),
  CONSTRAINT company_subscriptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(company_id) ON DELETE CASCADE,
  CONSTRAINT company_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES core.subscription_plans(plan_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_plan_id ON core.company_subscriptions(plan_id);

CREATE TRIGGER trg_set_updated_at_company_subscriptions
  BEFORE UPDATE ON core.company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Config AI par entreprise (fournisseur = enum)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.ai_configs (
  config_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  provider core.ai_provider NOT NULL,
  model_name text NOT NULL,
  api_key_encrypted text,
  json_key jsonb,
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  additional_config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  last_tested_at timestamptz,
  test_status text CHECK (test_status IN ('success', 'failed', 'not_tested')),
  test_error text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_configs_pkey PRIMARY KEY (config_id),
  CONSTRAINT ai_configs_company_provider_model_key UNIQUE (company_id, provider, model_name),
  CONSTRAINT ai_configs_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies(company_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_configs_company_id ON core.ai_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_configs_provider ON core.ai_configs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_configs_default ON core.ai_configs(company_id, is_default) WHERE is_default = true;

CREATE TRIGGER trg_set_updated_at_ai_configs
  BEFORE UPDATE ON core.ai_configs
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMIT;
