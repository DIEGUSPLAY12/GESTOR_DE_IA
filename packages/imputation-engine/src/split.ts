import Decimal from 'decimal.js'
import type { AccountOwnershipData } from './types.js'

export type OwnerShare = {
  personId: string
  amount: Decimal
}

/**
 * Splits a cost among account owners proportional to their ownership percentages.
 * Applies the last-penny rule: any rounding difference is added to the first owner's share,
 * guaranteeing that Σ(amounts) === cost exactly.
 */
export function splitByOwnership(
  cost: Decimal,
  ownerships: AccountOwnershipData[],
): OwnerShare[] {
  if (ownerships.length === 0) return []

  const hundred = new Decimal(100)

  // Calculate each owner's raw share, rounded to 4 decimal places (truncated)
  const shares: OwnerShare[] = ownerships.map((o) => ({
    personId: o.personId,
    amount: cost.mul(o.percentage).div(hundred).toDecimalPlaces(4, Decimal.ROUND_DOWN),
  }))

  // Last-penny rule: compute diff and add it to the first owner
  const sumRounded = shares.reduce((acc, s) => acc.add(s.amount), new Decimal(0))
  const diff = cost.toDecimalPlaces(4, Decimal.ROUND_DOWN).sub(sumRounded)

  if (!diff.isZero() && shares[0] !== undefined) {
    shares[0] = { personId: shares[0].personId, amount: shares[0].amount.add(diff) }
  }

  return shares
}
