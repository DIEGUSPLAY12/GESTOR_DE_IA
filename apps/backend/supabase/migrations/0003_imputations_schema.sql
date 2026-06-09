-- ============================================================
-- Migration: 0003_imputations_schema.sql
-- Tables: token_consumption, imputation_result
-- Depends on: 0001_master_schema.sql, 0002_assignment_schema.sql
-- ============================================================

-- ============================================================
-- TABLE: token_consumption
-- Imported logs for PAY_PER_TOKEN accounts (CSV upload).
-- Mutable: records can be corrected before an imputation run.
-- ============================================================

CREATE TABLE token_consumption (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID          NOT NULL REFERENCES ai_account (id) ON DELETE RESTRICT,
  period_start  DATE          NOT NULL,
  period_end    DATE          NOT NULL,
  total_cost    DECIMAL(19,4) NOT NULL,
  currency      CHAR(3)       NOT NULL DEFAULT 'EUR',

  CONSTRAINT token_consumption_cost_non_negative  CHECK (total_cost >= 0),
  CONSTRAINT token_consumption_currency_upper     CHECK (currency = upper(currency)),
  CONSTRAINT token_consumption_dates_valid        CHECK (period_end >= period_start)
);

CREATE INDEX idx_token_consumption_account  ON token_consumption (account_id, period_start, period_end);

COMMENT ON TABLE  token_consumption            IS 'Imported pay-per-token usage data for PAY_PER_TOKEN accounts.';
COMMENT ON COLUMN token_consumption.total_cost IS 'Total cost for the period in DECIMAL(19,4).';
COMMENT ON COLUMN token_consumption.currency   IS 'ISO 4217 three-letter currency code, always uppercase.';

-- ============================================================
-- TABLE: imputation_result
-- Immutable ledger entry produced by calculatePeriod().
-- Each row records the exact cents allocated from one account
-- to one person → one project (or the unallocated pool).
--
-- Immutability is enforced by a BEFORE UPDATE trigger that
-- raises an exception. Recalculations INSERT new rows with a
-- new audit_hash; they never UPDATE existing rows.
-- ============================================================

CREATE TABLE imputation_result (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month       CHAR(7)       NOT NULL,                          -- 'YYYY-MM'
  project_id         UUID          REFERENCES project    (id) ON DELETE RESTRICT,  -- NULL = bolsa no-imputado
  person_id          UUID          NOT NULL REFERENCES person     (id) ON DELETE RESTRICT,
  account_id         UUID          NOT NULL REFERENCES ai_account (id) ON DELETE RESTRICT,
  original_cost      DECIMAL(19,4) NOT NULL,                          -- account cost before split
  allocated_cost     DECIMAL(19,4) NOT NULL,                          -- final amount assigned to this row
  currency           CHAR(3)       NOT NULL DEFAULT 'EUR',
  calculation_trace  TEXT          NOT NULL DEFAULT '',               -- human-readable derivation trace
  calculated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  audit_hash         TEXT          NOT NULL,                          -- SHA-256 of the engine input JSON

  CONSTRAINT imputation_result_allocated_cost_non_negative  CHECK (allocated_cost >= 0),
  CONSTRAINT imputation_result_original_cost_non_negative   CHECK (original_cost  >= 0),
  CONSTRAINT imputation_result_currency_upper               CHECK (currency = upper(currency)),
  CONSTRAINT imputation_result_period_format                CHECK (period_month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

-- Indexes supporting the key query patterns from US2/US3/US4:
-- US3: SUM(allocated_cost) per project for a given period
CREATE INDEX idx_imputation_project_period  ON imputation_result (project_id, period_month);
-- US4: all rows for a person in a period
CREATE INDEX idx_imputation_person_period   ON imputation_result (person_id,  period_month);
-- Audit: lookup by hash
CREATE INDEX idx_imputation_audit_hash      ON imputation_result (audit_hash);

COMMENT ON TABLE  imputation_result                   IS 'Immutable ledger: each row is one cost allocation from an account to a person/project in a closed period.';
COMMENT ON COLUMN imputation_result.period_month      IS 'Period in YYYY-MM format, e.g. ''2026-05''.';
COMMENT ON COLUMN imputation_result.project_id        IS 'NULL indicates cost goes to the unallocated pool (bolsa no-imputado).';
COMMENT ON COLUMN imputation_result.original_cost     IS 'Account cost before ownership/project split, in DECIMAL(19,4).';
COMMENT ON COLUMN imputation_result.allocated_cost    IS 'Final cents allocated to this row after proration, ownership split, and project assignment.';
COMMENT ON COLUMN imputation_result.calculation_trace IS 'Human-readable derivation, e.g. "15 days × 50% ownership × 40% project allocation".';
COMMENT ON COLUMN imputation_result.audit_hash        IS 'SHA-256 of the serialised engine input. Same input always produces the same hash (SC-002).';

-- ============================================================
-- IMMUTABILITY TRIGGER for imputation_result
-- Prevents UPDATE on any column after INSERT.
-- Recalculations must INSERT new rows, never mutate old ones.
-- ============================================================

CREATE OR REPLACE FUNCTION deny_imputation_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'imputation_result rows are immutable. '
    'Create a new calculation run instead of updating id=%', OLD.id;
END;
$$;

CREATE TRIGGER trg_imputation_result_immutable
  BEFORE UPDATE ON imputation_result
  FOR EACH ROW EXECUTE FUNCTION deny_imputation_update();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE token_consumption  ENABLE ROW LEVEL SECURITY;
ALTER TABLE imputation_result  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_bypass" ON token_consumption
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass" ON imputation_result
  USING (auth.role() = 'service_role');
