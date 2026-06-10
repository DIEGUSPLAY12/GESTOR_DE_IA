import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { calculatePeriod } from '../src/index.js'
import type {
  ImputationPeriodRequest,
  BaseAccountData,
  AccountOwnershipData,
  ProjectAssignmentData,
  ConsumptionData,
  PeriodInfo,
} from '../src/types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(value: string | number): Decimal {
  return new Decimal(value)
}

function date(iso: string): Date {
  return new Date(iso)
}

const JAN_2026: PeriodInfo = {
  startDate: date('2026-01-01'),
  endDate: date('2026-01-31'),
  targetCurrency: 'EUR',
  exchangeRates: {},
}

function perSeatAccount(
  id: string,
  unitPrice: string,
  validFrom: string,
  validTo: string | null,
): BaseAccountData {
  return {
    id,
    planType: 'PER_SEAT',
    unitPrice: d(unitPrice),
    currency: 'EUR',
    validFrom: date(validFrom),
    validTo: validTo ? date(validTo) : null,
  }
}

function payPerTokenAccount(id: string): BaseAccountData {
  return {
    id,
    planType: 'PAY_PER_TOKEN',
    unitPrice: d('0'),
    currency: 'EUR',
    validFrom: date('2026-01-01'),
    validTo: null,
  }
}

function ownership(
  id: string,
  accountId: string,
  personId: string,
  percentage: string,
): AccountOwnershipData {
  return {
    id,
    accountId,
    personId,
    percentage: d(percentage),
    validFrom: date('2026-01-01'),
    validTo: null,
  }
}

function assignment(
  id: string,
  personId: string,
  projectId: string,
  percentage: string,
  validFrom = '2026-01-01',
  validTo: string | null = null,
): ProjectAssignmentData {
  return {
    id,
    personId,
    projectId,
    percentage: d(percentage),
    validFrom: date(validFrom),
    validTo: validTo ? date(validTo) : null,
  }
}

function sumAllocated(records: ReturnType<typeof calculatePeriod>): Decimal {
  return records.reduce((acc, r) => acc.add(r.allocatedCost), new Decimal(0))
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('calculatePeriod', () => {
  // ── SC-001 Suma Cero ───────────────────────────────────────────────────────

  it('SC-001: single account, single owner, single project → Suma Cero holds', () => {
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [perSeatAccount('acc-1', '100.0000', '2026-01-01', null)],
      consumptions: [],
      ownerships: [ownership('own-1', 'acc-1', 'person-1', '100')],
      assignments: [assignment('asgn-1', 'person-1', 'proj-A', '100')],
    }

    const records = calculatePeriod(request)

    expect(records.length).toBeGreaterThan(0)
    expect(sumAllocated(records).toFixed(4)).toBe('100.0000')
    // All records must have the required fields
    for (const r of records) {
      expect(r.accountId).toBe('acc-1')
      expect(r.personId).toBe('person-1')
      expect(r.allocatedCost instanceof Decimal).toBe(true)
      expect(r.calculationTrace.length).toBeGreaterThan(0)
    }
  })

  it('SC-001: multi-account, multi-owner scenario → Suma Cero holds', () => {
    // Account 1: 100€, owned 60% by person-1 and 40% by person-2
    // Account 2: 200€, owned 100% by person-3
    // Total cost: 300€
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [
        perSeatAccount('acc-1', '100.0000', '2026-01-01', null),
        perSeatAccount('acc-2', '200.0000', '2026-01-01', null),
      ],
      consumptions: [],
      ownerships: [
        ownership('own-1', 'acc-1', 'person-1', '60'),
        ownership('own-2', 'acc-1', 'person-2', '40'),
        ownership('own-3', 'acc-2', 'person-3', '100'),
      ],
      assignments: [
        assignment('asgn-1', 'person-1', 'proj-A', '100'),
        assignment('asgn-2', 'person-2', 'proj-B', '100'),
        assignment('asgn-3', 'person-3', 'proj-C', '100'),
      ],
    }

    const records = calculatePeriod(request)

    // Total allocated must equal total account costs: 100 + 200 = 300
    expect(sumAllocated(records).toFixed(4)).toBe('300.0000')
  })

  it('SC-001: prorated account (mid-month start) → Suma Cero still holds', () => {
    // Account active Jan 16-31 (16 days of 31)
    // unitPrice = 310 → prorated = 310 × (16/31) = 160.0000
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [perSeatAccount('acc-1', '310.0000', '2026-01-16', null)],
      consumptions: [],
      ownerships: [ownership('own-1', 'acc-1', 'person-1', '100')],
      assignments: [assignment('asgn-1', 'person-1', 'proj-A', '100')],
    }

    const records = calculatePeriod(request)
    // 310 × (16/31) = 160.0000
    expect(sumAllocated(records).toFixed(4)).toBe('160.0000')
  })

  // ── SC-US2-02 Bolsa no-imputado ────────────────────────────────────────────

  it('SC-US2-02: consultant without project → entire cost goes to pool', () => {
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [perSeatAccount('acc-1', '100.0000', '2026-01-01', null)],
      consumptions: [],
      ownerships: [ownership('own-1', 'acc-1', 'person-1', '100')],
      assignments: [], // no project assignments
    }

    const records = calculatePeriod(request)

    expect(records).toHaveLength(1)
    expect(records[0]?.projectId).toBeNull()
    expect(records[0]?.allocatedCost.toFixed(4)).toBe('100.0000')
    expect(sumAllocated(records).toFixed(4)).toBe('100.0000')
  })

  it('SC-US2-02: pool + project split sums to owner cost', () => {
    // person-1: 60% on proj-A all month, 40% unassigned → pool
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [perSeatAccount('acc-1', '100.0000', '2026-01-01', null)],
      consumptions: [],
      ownerships: [ownership('own-1', 'acc-1', 'person-1', '100')],
      assignments: [assignment('asgn-1', 'person-1', 'proj-A', '60')],
    }

    const records = calculatePeriod(request)

    const pool = records.find((r) => r.projectId === null)
    const projA = records.find((r) => r.projectId === 'proj-A')
    expect(pool?.allocatedCost.toFixed(4)).toBe('40.0000')
    expect(projA?.allocatedCost.toFixed(4)).toBe('60.0000')
    expect(sumAllocated(records).toFixed(4)).toBe('100.0000')
  })

  // ── PAY_PER_TOKEN ──────────────────────────────────────────────────────────

  it('uses consumption cost for PAY_PER_TOKEN accounts instead of proration', () => {
    // PAY_PER_TOKEN: unitPrice is ignored; actual cost comes from ConsumptionData
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [payPerTokenAccount('acc-ppt')],
      consumptions: [
        {
          id: 'cons-1',
          accountId: 'acc-ppt',
          totalCost: d('75.5000'),
          currency: 'EUR',
        } satisfies ConsumptionData,
      ],
      ownerships: [ownership('own-1', 'acc-ppt', 'person-1', '100')],
      assignments: [assignment('asgn-1', 'person-1', 'proj-A', '100')],
    }

    const records = calculatePeriod(request)

    expect(sumAllocated(records).toFixed(4)).toBe('75.5000')
  })

  // ── SC-002 Determinism ─────────────────────────────────────────────────────

  it('SC-002: same input produces identical output on repeated calls', () => {
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [
        perSeatAccount('acc-1', '100.0000', '2026-01-01', null),
        perSeatAccount('acc-2', '200.0000', '2026-01-01', null),
      ],
      consumptions: [],
      ownerships: [
        ownership('own-1', 'acc-1', 'person-1', '60'),
        ownership('own-2', 'acc-1', 'person-2', '40'),
        ownership('own-3', 'acc-2', 'person-3', '100'),
      ],
      assignments: [
        assignment('asgn-1', 'person-1', 'proj-A', '100'),
        assignment('asgn-2', 'person-2', 'proj-B', '100'),
        assignment('asgn-3', 'person-3', 'proj-C', '100'),
      ],
    }

    const run1 = calculatePeriod(request)
    const run2 = calculatePeriod(request)

    expect(run1.length).toBe(run2.length)
    expect(run1.map((r) => r.allocatedCost.toFixed(4))).toEqual(run2.map((r) => r.allocatedCost.toFixed(4)))
    expect(run1.map((r) => r.personId)).toEqual(run2.map((r) => r.personId))
    expect(run1.map((r) => r.projectId)).toEqual(run2.map((r) => r.projectId))
    expect(run1.map((r) => r.accountId)).toEqual(run2.map((r) => r.accountId))
  })

  // ── Account with no active ownerships ─────────────────────────────────────

  it('returns no records for an account with zero active ownerships', () => {
    const request: ImputationPeriodRequest = {
      periodInfo: JAN_2026,
      accounts: [perSeatAccount('acc-1', '100.0000', '2026-01-01', null)],
      consumptions: [],
      ownerships: [], // no owners in period
      assignments: [],
    }

    const records = calculatePeriod(request)

    // No owners → no records produced for this account
    expect(records).toHaveLength(0)
  })
})
