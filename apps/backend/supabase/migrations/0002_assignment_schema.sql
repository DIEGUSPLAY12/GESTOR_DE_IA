-- ============================================================
-- Migration: 0002_assignment_schema.sql
-- Tables: ai_account, account_ownership, project_assignment
-- Depends on: 0001_master_schema.sql
-- ============================================================

-- ============================================================
-- TABLE: ai_account
-- The licence or billing record that incurs actual spend.
-- ============================================================

CREATE TABLE ai_account (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_plan_id      UUID         NOT NULL REFERENCES pricing_plan (id) ON DELETE RESTRICT,
  external_identifier  TEXT         NOT NULL,   -- e.g. licence email or tenant ID
  valid_from           DATE         NOT NULL,
  valid_to             DATE,                    -- NULL = currently active account
  deleted_at           TIMESTAMPTZ

  CONSTRAINT ai_account_dates_valid CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE INDEX idx_ai_account_plan     ON ai_account (pricing_plan_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_ai_account_dates    ON ai_account (valid_from, valid_to);
CREATE INDEX idx_ai_account_deleted  ON ai_account (deleted_at);

COMMENT ON TABLE  ai_account                     IS 'A billable AI licence or API account with its active date range.';
COMMENT ON COLUMN ai_account.external_identifier IS 'Licence email, tenant ID, or any external reference string.';
COMMENT ON COLUMN ai_account.valid_to            IS 'NULL means the account is currently active.';

-- ============================================================
-- TABLE: account_ownership
-- Who holds a share of an AI account, and for what period.
-- Business rule: SUM(percentage) of active owners = 100
--   (enforced at the application/service layer, not DB-level,
--    because date ranges make a pure CHECK constraint impractical).
-- ============================================================

CREATE TABLE account_ownership (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID          NOT NULL REFERENCES ai_account (id) ON DELETE RESTRICT,
  person_id   UUID          NOT NULL REFERENCES person    (id) ON DELETE RESTRICT,
  percentage  DECIMAL(5,2)  NOT NULL,
  valid_from  DATE          NOT NULL,
  valid_to    DATE,         -- NULL = currently active

  CONSTRAINT account_ownership_percentage_range CHECK (percentage > 0 AND percentage <= 100),
  CONSTRAINT account_ownership_dates_valid       CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

-- Composite index for the "active owners of an account on a given date" query pattern
CREATE INDEX idx_acct_ownership_account  ON account_ownership (account_id, valid_from, valid_to);
CREATE INDEX idx_acct_ownership_person   ON account_ownership (person_id,  valid_from, valid_to);

COMMENT ON TABLE  account_ownership            IS 'Historical ownership shares (%) of an AI account by person.';
COMMENT ON COLUMN account_ownership.percentage IS 'Share of the account cost assigned to this person (0 < x <= 100). Application ensures active shares sum to 100.';
COMMENT ON COLUMN account_ownership.valid_to   IS 'NULL means ownership is currently active.';

-- ============================================================
-- TABLE: project_assignment
-- Consultant dedication to a project, with effective date range.
-- Business rule: SUM(percentage) of active assignments per person <= 100
--   (enforced at the application/service layer).
-- ============================================================

CREATE TABLE project_assignment (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID          NOT NULL REFERENCES person  (id) ON DELETE RESTRICT,
  project_id  UUID          NOT NULL REFERENCES project (id) ON DELETE RESTRICT,
  percentage  DECIMAL(5,2)  NOT NULL,
  valid_from  DATE          NOT NULL,
  valid_to    DATE,         -- NULL = currently assigned

  CONSTRAINT project_assignment_percentage_range CHECK (percentage > 0 AND percentage <= 100),
  CONSTRAINT project_assignment_dates_valid       CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

-- Query pattern: "all active assignments for a person in a period"
CREATE INDEX idx_proj_assignment_person   ON project_assignment (person_id,  valid_from, valid_to);
-- Query pattern: "all consultants assigned to a project"
CREATE INDEX idx_proj_assignment_project  ON project_assignment (project_id, valid_from, valid_to);

COMMENT ON TABLE  project_assignment            IS 'Consultant dedication (%) to a project during a date range.';
COMMENT ON COLUMN project_assignment.percentage IS 'Dedication share (0 < x <= 100). Application ensures active assignments per person do not exceed 100.';
COMMENT ON COLUMN project_assignment.valid_to   IS 'NULL means the assignment is currently active. Set to today to close an assignment (soft close).';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ai_account        ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_bypass" ON ai_account
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass" ON account_ownership
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass" ON project_assignment
  USING (auth.role() = 'service_role');
