-- ============================================================
-- Migration: 0001_master_schema.sql
-- Tables: person, project, ai_provider, pricing_plan
-- ============================================================

-- Enable uuid generation (Supabase includes pgcrypto by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TYPES
-- ============================================================

CREATE TYPE person_role AS ENUM ('ADMIN', 'PROJECT_MANAGER', 'CONSULTANT');

CREATE TYPE pricing_plan_type AS ENUM (
  'PER_SEAT',
  'POOL_SLOT',
  'PAY_PER_TOKEN',
  'VOLUME_TIER'
);

-- ============================================================
-- TABLE: person
-- ============================================================

CREATE TABLE person (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL,
  full_name    TEXT        NOT NULL,
  role         person_role NOT NULL DEFAULT 'CONSULTANT',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ -- soft delete; NULL = active

  CONSTRAINT person_email_unique UNIQUE (email)
);

CREATE INDEX idx_person_email     ON person (email)     WHERE deleted_at IS NULL;
CREATE INDEX idx_person_role      ON person (role)      WHERE deleted_at IS NULL;
CREATE INDEX idx_person_deleted   ON person (deleted_at);

COMMENT ON TABLE  person               IS 'Employees of the organisation. Soft-deleted via deleted_at.';
COMMENT ON COLUMN person.role          IS 'ADMIN | PROJECT_MANAGER | CONSULTANT';
COMMENT ON COLUMN person.deleted_at    IS 'Non-NULL marks logical deletion; row is kept for audit.';

-- ============================================================
-- TABLE: project
-- ============================================================

CREATE TABLE project (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 TEXT           NOT NULL,
  name                 TEXT           NOT NULL,
  client_name          TEXT           NOT NULL,
  project_manager_id   UUID           NOT NULL REFERENCES person (id) ON DELETE RESTRICT,
  start_date           DATE           NOT NULL,
  end_date             DATE,                                        -- nullable: open-ended projects
  monthly_budget       DECIMAL(19,4)  NOT NULL DEFAULT 0,          -- AI budget cap per period
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ

  CONSTRAINT project_code_unique UNIQUE (code),
  CONSTRAINT project_budget_non_negative CHECK (monthly_budget >= 0),
  CONSTRAINT project_dates_valid CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_project_code         ON project (code)               WHERE deleted_at IS NULL;
CREATE INDEX idx_project_manager      ON project (project_manager_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_project_dates        ON project (start_date, end_date);
CREATE INDEX idx_project_deleted      ON project (deleted_at);

COMMENT ON TABLE  project                  IS 'Cost centre where AI spending is allocated.';
COMMENT ON COLUMN project.code             IS 'Human-readable unique identifier, e.g. PRJ-123.';
COMMENT ON COLUMN project.monthly_budget   IS 'Maximum monthly AI budget in native currency (DECIMAL(19,4)).';

-- ============================================================
-- TABLE: ai_provider
-- ============================================================

CREATE TABLE ai_provider (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ

  CONSTRAINT ai_provider_name_unique UNIQUE (name)
);

CREATE INDEX idx_ai_provider_deleted ON ai_provider (deleted_at);

COMMENT ON TABLE ai_provider IS 'AI service vendors, e.g. OpenAI, Anthropic, Microsoft.';

-- ============================================================
-- TABLE: pricing_plan
-- ============================================================

CREATE TABLE pricing_plan (
  id             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    UUID               NOT NULL REFERENCES ai_provider (id) ON DELETE RESTRICT,
  type           pricing_plan_type  NOT NULL,
  name           TEXT               NOT NULL,
  unit_price     DECIMAL(19,4)      NOT NULL,
  currency       CHAR(3)            NOT NULL DEFAULT 'EUR',   -- ISO 4217
  effective_from DATE               NOT NULL,
  effective_to   DATE,                                        -- nullable: currently active plan
  deleted_at     TIMESTAMPTZ

  CONSTRAINT pricing_plan_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT pricing_plan_currency_upper CHECK (currency = upper(currency)),
  CONSTRAINT pricing_plan_dates_valid CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

CREATE INDEX idx_pricing_plan_provider  ON pricing_plan (provider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pricing_plan_dates     ON pricing_plan (effective_from, effective_to);
CREATE INDEX idx_pricing_plan_deleted   ON pricing_plan (deleted_at);

COMMENT ON TABLE  pricing_plan                IS 'Versioned cost rules for a provider product.';
COMMENT ON COLUMN pricing_plan.type           IS 'PER_SEAT | POOL_SLOT | PAY_PER_TOKEN | VOLUME_TIER';
COMMENT ON COLUMN pricing_plan.unit_price     IS 'Cost per unit (seat/token/slot) in DECIMAL(19,4).';
COMMENT ON COLUMN pricing_plan.currency       IS 'ISO 4217 three-letter currency code, always uppercase.';
COMMENT ON COLUMN pricing_plan.effective_to   IS 'NULL means the plan is currently active.';

-- ============================================================
-- TRIGGER: keep updated_at current
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_person_updated_at
  BEFORE UPDATE ON person
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_project_updated_at
  BEFORE UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ai_provider_updated_at
  BEFORE UPDATE ON ai_provider
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- RLS is enabled on all tables. The service-role key bypasses
-- RLS completely (used by the backend API). JWT-based access
-- policies will be added when Supabase Auth is wired up.

ALTER TABLE person       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plan ENABLE ROW LEVEL SECURITY;

-- Service role bypass (Supabase default — explicit for clarity)
CREATE POLICY "service_role_bypass" ON person
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass" ON project
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass" ON ai_provider
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass" ON pricing_plan
  USING (auth.role() = 'service_role');
