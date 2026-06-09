import type { Decimal } from 'decimal.js'

// ─── Period ──────────────────────────────────────────────────────────────────

export type PeriodInfo = {
  startDate: Date
  endDate: Date
  targetCurrency: string                    // ISO 4217, e.g. 'EUR'
  exchangeRates: Record<string, number>     // { 'USD': 0.92 } — rate TO targetCurrency
}

// ─── Input types (data fetched from DB, passed to the engine) ─────────────────

export type PlanType = 'PER_SEAT' | 'POOL_SLOT' | 'PAY_PER_TOKEN' | 'VOLUME_TIER'

export type BaseAccountData = {
  id: string
  planType: PlanType
  unitPrice: Decimal              // cost per seat/slot; ignored for PAY_PER_TOKEN
  currency: string                // native currency of the account's pricing plan
  validFrom: Date                 // account activation date
  validTo: Date | null            // null = currently active
}

export type ConsumptionData = {
  id: string
  accountId: string
  totalCost: Decimal              // measured cost for the period (PAY_PER_TOKEN only)
  currency: string
}

export type AccountOwnershipData = {
  id: string
  accountId: string
  personId: string
  percentage: Decimal             // 0 < x <= 100; active owners sum to 100
  validFrom: Date
  validTo: Date | null
}

export type ProjectAssignmentData = {
  id: string
  personId: string
  projectId: string
  percentage: Decimal             // 0 < x <= 100; per-person active assignments sum <= 100
  validFrom: Date
  validTo: Date | null
}

// ─── Engine request ───────────────────────────────────────────────────────────

export type ImputationPeriodRequest = {
  periodInfo: PeriodInfo
  accounts: BaseAccountData[]
  consumptions: ConsumptionData[]
  ownerships: AccountOwnershipData[]
  assignments: ProjectAssignmentData[]
}

// ─── Engine output ────────────────────────────────────────────────────────────

export type ImputationRecord = {
  internalLogId: string
  projectId: string | null        // null = bolsa no-imputado
  personId: string
  accountId: string
  originalCost: Decimal           // account cost before ownership split
  allocatedCost: Decimal          // final amount for this row (decimal.js)
  currency: string
  calculationTrace: string        // human-readable derivation
}
