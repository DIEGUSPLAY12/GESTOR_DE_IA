-- ============================================================
-- Migration: 0004_usage_log.sql
-- Tables: usage_log
-- Depends on: 0001_master_schema.sql, 0002_assignment_schema.sql
-- ============================================================

-- ============================================================
-- HELPER: map Supabase auth.uid() → person.id via email
-- Used by RLS policies below.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM   person p
  JOIN   auth.users au ON au.email = p.email
  WHERE  au.id = auth.uid()
    AND  p.deleted_at IS NULL
  LIMIT  1
$$;

COMMENT ON FUNCTION auth_person_id() IS
  'Returns the person.id that belongs to the currently authenticated Supabase user, matched via email.';

-- ============================================================
-- TABLE: usage_log
-- Manual AI usage entries submitted by consultants.
-- ============================================================

CREATE TABLE usage_log (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID          NOT NULL REFERENCES person     (id) ON DELETE RESTRICT,
  account_id      UUID          NOT NULL REFERENCES ai_account (id) ON DELETE RESTRICT,
  project_id      UUID          NOT NULL REFERENCES project     (id) ON DELETE RESTRICT,
  units_used      DECIMAL(19,4) NOT NULL,
  unit_label      TEXT          NOT NULL DEFAULT 'hours',
  calculated_cost DECIMAL(19,4) NOT NULL,
  currency        CHAR(3)       NOT NULL DEFAULT 'EUR',
  period_month    CHAR(7)       NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT usage_log_units_positive       CHECK (units_used > 0),
  CONSTRAINT usage_log_cost_non_negative    CHECK (calculated_cost >= 0),
  CONSTRAINT usage_log_currency_upper       CHECK (currency = upper(currency)),
  CONSTRAINT usage_log_period_month_format  CHECK (period_month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

CREATE INDEX idx_usage_log_person_period   ON usage_log (person_id,  period_month);
CREATE INDEX idx_usage_log_project_period  ON usage_log (project_id, period_month);
CREATE INDEX idx_usage_log_account         ON usage_log (account_id);

COMMENT ON TABLE  usage_log                  IS 'Manual AI usage entries recorded by consultants.';
COMMENT ON COLUMN usage_log.units_used       IS 'Quantity of the unit consumed (e.g. hours, tokens).';
COMMENT ON COLUMN usage_log.unit_label       IS 'Human-readable name for the unit, e.g. "hours" or "tokens".';
COMMENT ON COLUMN usage_log.calculated_cost  IS 'units_used × plan.unit_price, computed at insert time.';
COMMENT ON COLUMN usage_log.period_month     IS 'Billing period in YYYY-MM format.';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Consultants/PMs can read their own rows
CREATE POLICY usage_log_select_own ON usage_log
  FOR SELECT
  USING (person_id = auth_person_id());

-- ADMINs can read all rows
CREATE POLICY usage_log_select_admin ON usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   person p
      JOIN   auth.users au ON au.email = p.email
      WHERE  au.id = auth.uid()
        AND  p.role = 'ADMIN'
        AND  p.deleted_at IS NULL
    )
  );

-- Users can insert only their own rows
CREATE POLICY usage_log_insert_own ON usage_log
  FOR INSERT
  WITH CHECK (person_id = auth_person_id());
