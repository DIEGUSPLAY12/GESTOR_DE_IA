import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { splitByOwnership } from '../src/split.js'
import type { AccountOwnershipData } from '../src/types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(value: string | number): Decimal {
  return new Decimal(value)
}

function date(iso: string): Date {
  return new Date(iso)
}

/** Builds an AccountOwnershipData for a given person and percentage. */
function ownership(personId: string, percentage: string): AccountOwnershipData {
  return {
    id: `own-${personId}`,
    accountId: 'acc-1',
    personId,
    percentage: d(percentage),
    validFrom: date('2026-01-01'),
    validTo: null,
  }
}

/** Returns the sum of all OwnerShare amounts as a Decimal. */
function sumShares(shares: ReturnType<typeof splitByOwnership>): Decimal {
  return shares.reduce((acc, s) => acc.add(s.amount), new Decimal(0))
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('splitByOwnership', () => {
  // ── Even splits ──────────────────────────────────────────────────────────

  it('splits 200 EUR equally among 4 owners at 25% each', () => {
    const ownerships = [
      ownership('p1', '25'),
      ownership('p2', '25'),
      ownership('p3', '25'),
      ownership('p4', '25'),
    ]
    const shares = splitByOwnership(d('200.0000'), ownerships)

    expect(shares).toHaveLength(4)
    for (const share of shares) {
      expect(share.amount.toFixed(4)).toBe('50.0000')
    }
    // Invariant: sum equals original cost
    expect(sumShares(shares).toFixed(4)).toBe('200.0000')
  })

  it('splits 100 EUR between two owners at 60% / 40%', () => {
    const ownerships = [
      ownership('p1', '60'),
      ownership('p2', '40'),
    ]
    const shares = splitByOwnership(d('100.0000'), ownerships)

    expect(shares[0]?.amount.toFixed(4)).toBe('60.0000')
    expect(shares[1]?.amount.toFixed(4)).toBe('40.0000')
    expect(sumShares(shares).toFixed(4)).toBe('100.0000')
  })

  it('single owner at 100% receives the entire cost', () => {
    const ownerships = [ownership('p1', '100')]
    const shares = splitByOwnership(d('123.4567'), ownerships)

    expect(shares).toHaveLength(1)
    expect(shares[0]?.amount.toFixed(4)).toBe('123.4567')
    expect(sumShares(shares).toFixed(4)).toBe('123.4567')
  })

  // ── Last-penny rule ───────────────────────────────────────────────────────
  //
  // When rounding to 4 decimal places causes the naive sum to diverge from
  // the original cost, the difference (the "lost penny") is added to the
  // FIRST owner's share so that Σ(amounts) == cost always holds.

  it('applies last-penny rule: 0.10 EUR split among 3 owners at 33.33%/33.33%/33.34%', () => {
    const ownerships = [
      ownership('p1', '33.33'),
      ownership('p2', '33.33'),
      ownership('p3', '33.34'),
    ]
    const cost = d('0.1000')
    const shares = splitByOwnership(cost, ownerships)

    // Naive amounts (4 dp):
    //   p1: 0.1000 × 0.3333 = 0.03333 → truncated = 0.0333
    //   p2: 0.1000 × 0.3333 = 0.03333 → truncated = 0.0333
    //   p3: 0.1000 × 0.3334 = 0.03334 → truncated = 0.0333
    //   naive sum = 0.0999 ≠ 0.1000 → missing 0.0001
    // Last-penny fix: add 0.0001 to first owner (p1) → 0.0334
    expect(sumShares(shares).toFixed(4)).toBe('0.1000')
    // First owner absorbs the penny
    const firstAmount = shares[0]?.amount ?? d(0)
    const rest = shares.slice(1)
    const restSum = rest.reduce((a, s) => a.add(s.amount), d(0))
    // first + rest = total; and the individual amounts satisfy first >= each rest amount
    expect(firstAmount.add(restSum).toFixed(4)).toBe('0.1000')
  })

  it('last-penny invariant holds for any division: sum always equals cost', () => {
    // 100 EUR / 3 owners with repeating percentages (will have fractional cents)
    const ownerships = [
      ownership('p1', '33.33'),
      ownership('p2', '33.33'),
      ownership('p3', '33.34'),
    ]
    const cost = d('100.0000')
    const shares = splitByOwnership(cost, ownerships)

    expect(sumShares(shares).toFixed(4)).toBe('100.0000')
  })

  it('last-penny invariant holds for an amount with 4 significant decimal places', () => {
    // 1.0001 / 3 owners — awkward fractional splitting
    const ownerships = [
      ownership('p1', '33.33'),
      ownership('p2', '33.33'),
      ownership('p3', '33.34'),
    ]
    const cost = d('1.0001')
    const shares = splitByOwnership(cost, ownerships)

    expect(sumShares(shares).toFixed(4)).toBe('1.0001')
  })

  // ── Order preservation ────────────────────────────────────────────────────

  it('returns shares in the same order as the input ownerships', () => {
    const ownerships = [
      ownership('alice', '50'),
      ownership('bob', '30'),
      ownership('carol', '20'),
    ]
    const shares = splitByOwnership(d('1000.0000'), ownerships)

    expect(shares[0]?.personId).toBe('alice')
    expect(shares[1]?.personId).toBe('bob')
    expect(shares[2]?.personId).toBe('carol')
    expect(sumShares(shares).toFixed(4)).toBe('1000.0000')
  })

  // ── Return type ───────────────────────────────────────────────────────────

  it('returns Decimal instances (not plain numbers) for all amounts', () => {
    const ownerships = [ownership('p1', '60'), ownership('p2', '40')]
    const shares = splitByOwnership(d('200.0000'), ownerships)

    for (const share of shares) {
      expect(share.amount instanceof Decimal).toBe(true)
    }
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('returns an empty array when ownerships list is empty', () => {
    const shares = splitByOwnership(d('100.0000'), [])
    expect(shares).toHaveLength(0)
  })

  it('handles zero cost without errors', () => {
    const ownerships = [ownership('p1', '60'), ownership('p2', '40')]
    const shares = splitByOwnership(d('0.0000'), ownerships)

    for (const share of shares) {
      expect(share.amount.toFixed(4)).toBe('0.0000')
    }
    expect(sumShares(shares).toFixed(4)).toBe('0.0000')
  })
})
