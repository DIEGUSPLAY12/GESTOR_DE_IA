import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { prorateAccount } from '../src/proration.js'
import type { BaseAccountData, PeriodInfo } from '../src/types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(value: string | number): Decimal {
  return new Decimal(value)
}

function date(iso: string): Date {
  return new Date(iso)
}

/** Builds a minimal BaseAccountData for proration tests. */
function account(
  validFrom: string,
  validTo: string | null,
  unitPrice = '100.0000',
): BaseAccountData {
  return {
    id: 'acc-1',
    planType: 'PER_SEAT',
    unitPrice: d(unitPrice),
    currency: 'EUR',
    validFrom: date(validFrom),
    validTo: validTo ? date(validTo) : null,
  }
}

/** January 2026: 31 days. */
const JAN_2026: PeriodInfo = {
  startDate: date('2026-01-01'),
  endDate: date('2026-01-31'),
  targetCurrency: 'EUR',
  exchangeRates: {},
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('prorateAccount', () => {
  it('returns full cost when account is active the entire period', () => {
    const acc = account('2026-01-01', null)           // active all month
    const result = prorateAccount(acc, JAN_2026)

    // 31/31 days → ratio = 1 → cost = 100.0000
    expect(result.toFixed(4)).toBe('100.0000')
  })

  it('prorates when account activates mid-period (day 15 of 31)', () => {
    const acc = account('2026-01-15', null)           // active from day 15 to end
    const result = prorateAccount(acc, JAN_2026)

    // Active days: 15, 16, …, 31 = 17 days
    // Expected = 100 × (17 / 31)
    const expected = d('100').mul(d(17)).div(d(31))
    expect(result.toFixed(4)).toBe(expected.toFixed(4))
  })

  it('prorates when account closes mid-period (valid_to = Jan 15)', () => {
    const acc = account('2026-01-01', '2026-01-15')   // active 15 days
    const result = prorateAccount(acc, JAN_2026)

    // Active days: 1–15 = 15 days
    // Expected = 100 × (15 / 31)
    const expected = d('100').mul(d(15)).div(d(31))
    expect(result.toFixed(4)).toBe(expected.toFixed(4))
  })

  it('prorates when account spans only part of the middle of a period', () => {
    const acc = account('2026-01-10', '2026-01-20')   // 11 days
    const result = prorateAccount(acc, JAN_2026)

    // Active days: 10–20 = 11 days
    const expected = d('100').mul(d(11)).div(d(31))
    expect(result.toFixed(4)).toBe(expected.toFixed(4))
  })

  it('returns Decimal(0) when account was not active during the period', () => {
    // Account ended before the period began
    const acc = account('2025-10-01', '2025-12-31')
    const result = prorateAccount(acc, JAN_2026)

    expect(result.toFixed(4)).toBe('0.0000')
  })

  it('returns Decimal(0) when account starts after the period ends', () => {
    const acc = account('2026-02-01', null)
    const result = prorateAccount(acc, JAN_2026)

    expect(result.toFixed(4)).toBe('0.0000')
  })

  it('handles single-day active period correctly', () => {
    const acc = account('2026-01-31', '2026-01-31')   // only last day
    const result = prorateAccount(acc, JAN_2026)

    const expected = d('100').mul(d(1)).div(d(31))
    expect(result.toFixed(4)).toBe(expected.toFixed(4))
  })

  it('preserves DECIMAL(19,4) precision — no floating-point drift', () => {
    // Classic IEEE-754 pitfall: 100/3 should not drift when using Decimal
    const acc = account('2026-01-01', '2026-01-10', '100.0000')  // 10 days of 31
    const result = prorateAccount(acc, JAN_2026)

    // Must be computed via decimal.js, not native division
    const expected = d('100').mul(d(10)).div(d(31))
    // Verify 4 decimal places match exactly
    expect(result.toFixed(4)).toBe(expected.toFixed(4))
    // Verify the result is a Decimal instance (not a plain number)
    expect(result instanceof Decimal).toBe(true)
  })

  it('handles a 28-day February period correctly', () => {
    const FEB_2026: PeriodInfo = {
      startDate: date('2026-02-01'),
      endDate: date('2026-02-28'),
      targetCurrency: 'EUR',
      exchangeRates: {},
    }
    const acc = account('2026-02-15', null)           // active 14 days of 28
    const result = prorateAccount(acc, FEB_2026)

    const expected = d('100').mul(d(14)).div(d(28))
    expect(result.toFixed(4)).toBe(expected.toFixed(4))
  })

  it('applies exchange rate when account currency differs from target currency', () => {
    const USD_PERIOD: PeriodInfo = {
      startDate: date('2026-01-01'),
      endDate: date('2026-01-31'),
      targetCurrency: 'EUR',
      exchangeRates: { USD: 0.92 },                  // 1 USD = 0.92 EUR
    }
    const usdAccount: BaseAccountData = {
      id: 'acc-usd',
      planType: 'PER_SEAT',
      unitPrice: d('100.0000'),
      currency: 'USD',
      validFrom: date('2026-01-01'),
      validTo: null,
    }
    const result = prorateAccount(usdAccount, USD_PERIOD)

    // Full period (31/31) × 100 USD × 0.92 = 92.0000 EUR
    expect(result.toFixed(4)).toBe('92.0000')
  })
})
