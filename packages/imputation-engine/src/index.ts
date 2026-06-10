import Decimal from 'decimal.js'
import { prorateAccount } from './proration.js'
import { splitByOwnership } from './split.js'
import { assignToProjects } from './assignment.js'
import type {
  ImputationPeriodRequest,
  ImputationRecord,
  BaseAccountData,
  ConsumptionData,
  PeriodInfo,
} from './types.js'

// Public types re-exported for consumers (e.g. backend service)
export type {
  ImputationPeriodRequest,
  ImputationRecord,
  BaseAccountData,
  ConsumptionData,
  AccountOwnershipData,
  ProjectAssignmentData,
  PeriodInfo,
  PlanType,
} from './types.js'
export type { ProjectAllocation } from './assignment.js'
export type { OwnerShare } from './split.js'

/**
 * Returns the total cost for an account in the given period.
 * PAY_PER_TOKEN: sums all matching consumption records (FX-adjusted).
 * All other plan types: prorate by active days.
 */
function getAccountCost(
  account: BaseAccountData,
  consumptions: ConsumptionData[],
  period: PeriodInfo,
): Decimal {
  if (account.planType === 'PAY_PER_TOKEN') {
    return consumptions
      .filter((c) => c.accountId === account.id)
      .reduce((acc, c) => {
        const fxRate =
          c.currency === period.targetCurrency
            ? new Decimal(1)
            : new Decimal(period.exchangeRates[c.currency] ?? 1)
        return acc.add(c.totalCost.mul(fxRate))
      }, new Decimal(0))
  }
  return prorateAccount(account, period)
}

/**
 * Calculates imputation records for all accounts in the period.
 *
 * Pipeline per account:
 *   1. Compute account cost (proration or consumption sum)
 *   2. Split cost among active owners (splitByOwnership)
 *   3. For each owner share, assign to projects (assignToProjects)
 *   4. Assemble ImputationRecord for each project allocation
 *
 * Post-condition (SC-001 Suma Cero):
 *   Σ(allocatedCost) === Σ(account costs) — throws if violated.
 *
 * Determinism (SC-002): pure function, no randomness or external state.
 */
export function calculatePeriod(request: ImputationPeriodRequest): ImputationRecord[] {
  const { periodInfo, accounts, consumptions, ownerships, assignments } = request
  const records: ImputationRecord[] = []
  let totalAccountCost = new Decimal(0)

  for (const account of accounts) {
    // Filter ownerships active for this account — skip unowned accounts entirely
    const accountOwnerships = ownerships.filter((o) => o.accountId === account.id)
    if (accountOwnerships.length === 0) continue

    const accountCost = getAccountCost(account, consumptions, periodInfo)
    totalAccountCost = totalAccountCost.add(accountCost)

    // Split account cost among owners
    const ownerShares = splitByOwnership(accountCost, accountOwnerships)

    for (const share of ownerShares) {
      // Get project assignments for this person
      const personAssignments = assignments.filter((a) => a.personId === share.personId)

      // Distribute owner share to projects (or pool)
      const allocations = assignToProjects(
        share.amount,
        share.personId,
        personAssignments,
        periodInfo,
      )

      for (const alloc of allocations) {
        const internalLogId = `${account.id}:${share.personId}:${alloc.projectId ?? 'pool'}`
        records.push({
          internalLogId,
          projectId: alloc.projectId,
          personId: alloc.personId,
          accountId: account.id,
          originalCost: share.amount,
          allocatedCost: alloc.allocatedCost,
          currency: periodInfo.targetCurrency,
          calculationTrace: alloc.calculationTrace,
        })
      }
    }
  }

  // SC-001 invariant check
  const totalAllocated = records.reduce((acc, r) => acc.add(r.allocatedCost), new Decimal(0))
  if (!totalAllocated.equals(totalAccountCost)) {
    throw new Error(
      `SC-001 Suma Cero violated: expected ${totalAccountCost.toFixed(4)}, got ${totalAllocated.toFixed(4)}`,
    )
  }

  return records
}
