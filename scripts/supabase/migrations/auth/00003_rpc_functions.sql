-- Migration 00003 : Fonctions RPC (profil, entreprises)
-- À exécuter après 00001 et 00002. Les fonctions sont dans public pour être appelables par le client.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. get_user_profile : récupérer le profil d'un utilisateur
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  type_user core.type_user,
  is_admin boolean,
  subscription jsonb,
  sub_related_to uuid,
  stripe_subscription jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.full_name,
    p.phone,
    p.type_user,
    p.is_admin,
    p.subscription,
    p.sub_related_to,
    p.stripe_subscription,
    p.created_at,
    p.updated_at
  FROM core.profiles p
  WHERE p.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_user_profile(uuid) IS 'Retourne le profil applicatif d''un utilisateur (core.profiles)';

-- -----------------------------------------------------------------------------
-- 2. create_user_profile : créer ou mettre à jour le profil (premier login)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_email text DEFAULT '',
  p_full_name text DEFAULT '',
  p_phone text DEFAULT NULL,
  p_type_user text DEFAULT 'merchant'
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  type_user core.type_user,
  is_admin boolean,
  subscription jsonb,
  sub_related_to uuid,
  stripe_subscription jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
BEGIN
  IF p_type_user IS NOT NULL AND p_type_user NOT IN ('accountant', 'merchant', 'both', 'employee') THEN
    RAISE EXCEPTION 'Invalid type_user. Must be one of: accountant, merchant, both, employee';
  END IF;

  INSERT INTO core.profiles (
    user_id,
    email,
    full_name,
    phone,
    type_user,
    subscription,
    stripe_subscription,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(NULLIF(TRIM(p_email), ''), 'user-' || p_user_id::text || '@profile.local'),
    COALESCE(NULLIF(TRIM(p_full_name), ''), ''),
    p_phone,
    COALESCE(NULLIF(p_type_user, '')::core.type_user, 'merchant'::core.type_user),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), core.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, core.profiles.phone),
    type_user = COALESCE(NULLIF(EXCLUDED.type_user::text, '')::core.type_user, core.profiles.type_user),
    updated_at = now();

  RETURN QUERY SELECT * FROM public.get_user_profile(p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, text, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.create_user_profile(uuid, text, text, text, text) IS 'Crée ou met à jour le profil (appel au premier login ou si profil manquant)';

-- -----------------------------------------------------------------------------
-- 3. update_user_profile : mettre à jour le profil (édition)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_type_user text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  type_user core.type_user,
  is_admin boolean,
  subscription jsonb,
  sub_related_to uuid,
  stripe_subscription jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM core.profiles WHERE core.profiles.user_id = p_user_id) THEN
    RAISE EXCEPTION 'Profile not found for user: %', p_user_id;
  END IF;

  IF p_type_user IS NOT NULL AND p_type_user NOT IN ('accountant', 'merchant', 'both', 'employee') THEN
    RAISE EXCEPTION 'Invalid type_user. Must be one of: accountant, merchant, both, employee';
  END IF;

  UPDATE core.profiles
  SET
    full_name = COALESCE(p_full_name, core.profiles.full_name),
    phone = COALESCE(p_phone, core.profiles.phone),
    type_user = COALESCE(p_type_user::core.type_user, core.profiles.type_user),
    updated_at = now()
  WHERE core.profiles.user_id = p_user_id;

  RETURN QUERY SELECT * FROM public.get_user_profile(p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_profile(uuid, text, text, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.update_user_profile(uuid, text, text, text) IS 'Met à jour le profil et retourne le profil à jour';

-- -----------------------------------------------------------------------------
-- 4. list_companies_for_user : liste des entreprises de l'utilisateur connecté
-- Utilise auth.uid() pour filtrer par l'utilisateur courant.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_companies_for_user(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS TABLE (
  company_id uuid,
  legal_name text,
  registration_no text,
  vat_number text,
  country text,
  currency text,
  email text,
  phone text,
  industry text,
  logo_url text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_role core.company_member_role,
  membership_status core.company_member_status,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
  v_uid uuid;
  v_total bigint;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM core.companies c
  INNER JOIN core.company_members cm ON cm.company_id = c.company_id
  WHERE cm.user_id = v_uid
    AND cm.status = 'active'
    AND (p_search IS NULL OR c.legal_name ILIKE '%' || p_search || '%' OR c.vat_number ILIKE '%' || p_search || '%')
    AND (p_country IS NULL OR c.country = p_country)
    AND (p_is_active IS NULL OR c.is_active = p_is_active);

  RETURN QUERY
  SELECT
    c.company_id,
    c.legal_name,
    c.registration_no,
    c.vat_number,
    c.country,
    c.currency,
    c.email,
    c.phone,
    c.industry,
    c.logo_url,
    c.is_active,
    c.created_at,
    c.updated_at,
    cm.role AS user_role,
    cm.status AS membership_status,
    v_total AS total_count
  FROM core.companies c
  INNER JOIN core.company_members cm ON cm.company_id = c.company_id
  WHERE cm.user_id = v_uid
    AND cm.status = 'active'
    AND (p_search IS NULL OR c.legal_name ILIKE '%' || p_search || '%' OR c.vat_number ILIKE '%' || p_search || '%')
    AND (p_country IS NULL OR c.country = p_country)
    AND (p_is_active IS NULL OR c.is_active = p_is_active)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_companies_for_user(integer, integer, text, text, boolean) TO authenticated, service_role;
COMMENT ON FUNCTION public.list_companies_for_user(integer, integer, text, text, boolean) IS 'Liste les entreprises de l''utilisateur connecté (auth.uid()) avec pagination et filtres';

-- -----------------------------------------------------------------------------
-- 5. create_company : créer une entreprise et ajouter l'utilisateur comme owner
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_company(
  p_legal_name text,
  p_country text DEFAULT 'FR',
  p_currency text DEFAULT 'EUR',
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
  v_uid uuid;
  v_company_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM core.profiles WHERE core.profiles.user_id = v_uid) THEN
    RAISE EXCEPTION 'Profile not found. Call create_user_profile first.';
  END IF;

  INSERT INTO core.companies (legal_name, country, currency, email, phone)
  VALUES (p_legal_name, p_country, p_currency, p_email, p_phone)
  RETURNING core.companies.company_id INTO v_company_id;

  INSERT INTO core.company_members (company_id, user_id, role, status)
  VALUES (v_company_id, v_uid, 'owner'::core.company_member_role, 'active'::core.company_member_status);

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company(text, text, text, text, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.create_company(text, text, text, text, text) IS 'Crée une entreprise et ajoute l''utilisateur connecté comme owner';

COMMIT;
