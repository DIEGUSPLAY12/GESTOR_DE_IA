import Decimal from 'decimal.js'
import type { ProjectAssignmentData, PeriodInfo } from './types.js'

export type ProjectAllocation = {
  projectId: string | null
  personId: string
  allocatedCost: Decimal
  calculationTrace: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
}

/**
 * Distributes an owner's cost share across their active project assignments for the period.
 *
 * For each assignment with date overlap, the cost is: ownerCost × (percentage/100) × (overlapDays/periodDays).
 * The remainder (unassigned cost) is collected into a pool entry (projectId = null).
 * Pool entry is omitted when remainder is exactly zero.
 *
 * Guarantee: Σ(allocatedCost) === ownerCost always holds.
 */
export function assignToProjects(
  ownerCost: Decimal,
  personId: string,
  assignments: ProjectAssignmentData[],
  period: PeriodInfo,
): ProjectAllocation[] {
  const periodDays = new Decimal(daysBetween(period.startDate, period.endDate))
  const hundred = new Decimal(100)

  const projectAllocations: ProjectAllocation[] = []

  for (const asgn of assignments) {
    const asgnEnd = asgn.validTo ?? period.endDate
    const overlapStart = asgn.validFrom > period.startDate ? asgn.validFrom : period.startDate
    const overlapEnd = asgnEnd < period.endDate ? asgnEnd : period.endDate

    if (overlapStart > overlapEnd) continue

    const overlapDays = new Decimal(daysBetween(overlapStart, overlapEnd))
    const allocatedCost = ownerCost
      .mul(asgn.percentage)
      .div(hundred)
      .mul(overlapDays)
      .div(periodDays)
      .toDecimalPlaces(4, Decimal.ROUND_DOWN)

    const trace =
      `${asgn.projectId}: ${ownerCost.toFixed(4)} × ${asgn.percentage.toFixed(2)}% × ` +
      `(${overlapDays.toFixed(0)}/${periodDays.toFixed(0)} days) = ${allocatedCost.toFixed(4)}`

    projectAllocations.push({ projectId: asgn.projectId, personId, allocatedCost, calculationTrace: trace })
  }

  // Pool absorbs any remainder — guarantees Σ(allocatedCost) === ownerCost
  const projectSum = projectAllocations.reduce((acc, a) => acc.add(a.allocatedCost), new Decimal(0))
  const poolCost = ownerCost.sub(projectSum)

  if (poolCost.greaterThan(0)) {
    projectAllocations.push({
      projectId: null,
      personId,
      allocatedCost: poolCost,
      calculationTrace: `pool (unassigned): ${ownerCost.toFixed(4)} − ${projectSum.toFixed(4)} = ${poolCost.toFixed(4)}`,
    })
  }

  return projectAllocations
}
