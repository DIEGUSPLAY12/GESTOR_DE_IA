import Decimal from 'decimal.js'
import type { BaseAccountData, PeriodInfo } from './types.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Returns the number of calendar days between two UTC midnight dates (inclusive).
 * Both dates must be at UTC midnight (as produced by `new Date('YYYY-MM-DD')`).
 */
function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
}

/**
 * Calculates the prorated cost of an AI account for a given period.
 *
 * Formula:
 *   proratedCost = unitPrice × (activeDays / periodDays) × exchangeRate
 *
 * Where:
 *   - activeDays  = number of days the account was active within [period.startDate, period.endDate]
 *   - periodDays  = total calendar days in the period (inclusive)
 *   - exchangeRate = period.exchangeRates[account.currency] if currencies differ, else 1
 *
 * Returns Decimal('0') if the account was not active at any point during the period.
 * All arithmetic uses decimal.js to avoid IEEE-754 floating-point drift.
 */
export function prorateAccount(account: BaseAccountData, period: PeriodInfo): Decimal {
  const periodStart = period.startDate
  const periodEnd = period.endDate
  const accountEnd = account.validTo ?? periodEnd   // treat null validTo as open-ended

  // Overlap window
  const overlapStart = account.validFrom > periodStart ? account.validFrom : periodStart
  const overlapEnd = accountEnd < periodEnd ? accountEnd : periodEnd

  // No overlap → zero cost
  if (overlapStart > overlapEnd) {
    return new Decimal(0)
  }

  const activeDays = daysBetween(overlapStart, overlapEnd)
  const periodDays = daysBetween(periodStart, periodEnd)

  // Exchange rate: convert account currency to target currency
  const exchangeRate =
    account.currency === period.targetCurrency
      ? new Decimal(1)
      : new Decimal(period.exchangeRates[account.currency] ?? 1)

  return account.unitPrice
    .mul(new Decimal(activeDays))
    .div(new Decimal(periodDays))
    .mul(exchangeRate)
}
