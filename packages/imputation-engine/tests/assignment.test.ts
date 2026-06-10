import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { assignToProjects } from '../src/assignment.js'
import type { ProjectAssignmentData, PeriodInfo } from '../src/types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(value: string | number): Decimal {
  return new Decimal(value)
}

function date(iso: string): Date {
  return new Date(iso)
}

/** January 2026: 31 days */
const JAN_2026: PeriodInfo = {
  startDate: date('2026-01-01'),
  endDate: date('2026-01-31'),
  targetCurrency: 'EUR',
  exchangeRates: {},
}

function assignment(
  personId: string,
  projectId: string,
  percentage: string,
  validFrom: string,
  validTo: string | null,
): ProjectAssignmentData {
  return {
    id: `asgn-${personId}-${projectId}`,
    personId,
    projectId,
    percentage: d(percentage),
    validFrom: date(validFrom),
    validTo: validTo ? date(validTo) : null,
  }
}

function sumAllocations(allocs: ReturnType<typeof assignToProjects>): Decimal {
  return allocs.reduce((acc, a) => acc.add(a.allocatedCost), new Decimal(0))
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('assignToProjects', () => {
  // ── Full-month assignments ─────────────────────────────────────────────────

  it('distributes cost at 60%/40% across two full-month projects', () => {
    const allocs = assignToProjects(
      d('100.0000'),
      'person-1',
      [
        assignment('person-1', 'proj-A', '60', '2026-01-01', null),
        assignment('person-1', 'proj-B', '40', '2026-01-01', null),
      ],
      JAN_2026,
    )

    const byProject = Object.fromEntries(allocs.map((a) => [a.projectId, a.allocatedCost]))
    expect(byProject['proj-A']?.toFixed(4)).toBe('60.0000')
    expect(byProject['proj-B']?.toFixed(4)).toBe('40.0000')
    expect(sumAllocations(allocs).toFixed(4)).toBe('100.0000')
  })

  it('sends entire cost to pool when there are no assignments', () => {
    const allocs = assignToProjects(d('100.0000'), 'person-1', [], JAN_2026)

    expect(allocs).toHaveLength(1)
    expect(allocs[0]?.projectId).toBeNull()
    expect(allocs[0]?.allocatedCost.toFixed(4)).toBe('100.0000')
  })

  it('omits pool entry when consultant is 100% assigned all month', () => {
    const allocs = assignToProjects(
      d('100.0000'),
      'person-1',
      [assignment('person-1', 'proj-A', '100', '2026-01-01', null)],
      JAN_2026,
    )

    const pool = allocs.find((a) => a.projectId === null)
    expect(pool).toBeUndefined()
    expect(sumAllocations(allocs).toFixed(4)).toBe('100.0000')
  })

  // ── Temporal proration ─────────────────────────────────────────────────────

  it('prorates an assignment covering Jan 1-10 (10 of 31 days)', () => {
    // Use ownerCost = 310 so that 310 × (10/31) = 100.0000 exactly
    const allocs = assignToProjects(
      d('310.0000'),
      'person-1',
      [assignment('person-1', 'proj-A', '100', '2026-01-01', '2026-01-10')],
      JAN_2026,
    )

    // proj-A: 310 × 1.0 × (10/31) = 100.0000
    // pool:  310 - 100 = 210.0000
    expect(allocs.find((a) => a.projectId === 'proj-A')?.allocatedCost.toFixed(4)).toBe('100.0000')
    expect(allocs.find((a) => a.projectId === null)?.allocatedCost.toFixed(4)).toBe('210.0000')
    expect(sumAllocations(allocs).toFixed(4)).toBe('310.0000')
  })

  it('handles two sequential assignments covering the entire month (no pool)', () => {
    // proj-A: Jan 1-15 (15 days), proj-B: Jan 16-31 (16 days)
    // Use ownerCost = 310 so 310×(15/31) + 310×(16/31) = 150 + 160 = 310.0000
    const allocs = assignToProjects(
      d('310.0000'),
      'person-1',
      [
        assignment('person-1', 'proj-A', '100', '2026-01-01', '2026-01-15'),
        assignment('person-1', 'proj-B', '100', '2026-01-16', '2026-01-31'),
      ],
      JAN_2026,
    )

    expect(allocs.find((a) => a.projectId === 'proj-A')?.allocatedCost.toFixed(4)).toBe('150.0000')
    expect(allocs.find((a) => a.projectId === 'proj-B')?.allocatedCost.toFixed(4)).toBe('160.0000')
    // No pool
    expect(allocs.find((a) => a.projectId === null)).toBeUndefined()
    expect(sumAllocations(allocs).toFixed(4)).toBe('310.0000')
  })

  it('produces a pool entry for the gap between two non-adjacent assignments', () => {
    // proj-A: Jan 1-10 (10 days), proj-B: Jan 21-31 (11 days), gap Jan 11-20 (10 days → pool)
    // Use 310 for clean math: each 10 days = 100.0000
    const allocs = assignToProjects(
      d('310.0000'),
      'person-1',
      [
        assignment('person-1', 'proj-A', '100', '2026-01-01', '2026-01-10'),
        assignment('person-1', 'proj-B', '100', '2026-01-21', '2026-01-31'),
      ],
      JAN_2026,
    )

    expect(allocs.find((a) => a.projectId === 'proj-A')?.allocatedCost.toFixed(4)).toBe('100.0000')
    expect(allocs.find((a) => a.projectId === 'proj-B')?.allocatedCost.toFixed(4)).toBe('110.0000')
    expect(allocs.find((a) => a.projectId === null)?.allocatedCost.toFixed(4)).toBe('100.0000')
    expect(sumAllocations(allocs).toFixed(4)).toBe('310.0000')
  })

  // ── Partial percentage ─────────────────────────────────────────────────────

  it('routes unassigned percentage fraction to the pool', () => {
    // 60% on proj-A all month; 40% unassigned → pool
    const allocs = assignToProjects(
      d('100.0000'),
      'person-1',
      [assignment('person-1', 'proj-A', '60', '2026-01-01', null)],
      JAN_2026,
    )

    expect(allocs.find((a) => a.projectId === 'proj-A')?.allocatedCost.toFixed(4)).toBe('60.0000')
    expect(allocs.find((a) => a.projectId === null)?.allocatedCost.toFixed(4)).toBe('40.0000')
    expect(sumAllocations(allocs).toFixed(4)).toBe('100.0000')
  })

  // ── Invariants ────────────────────────────────────────────────────────────

  it('invariant: sum of all allocations always equals ownerCost (last-penny rule)', () => {
    // Fractional case: 133.3333 split among 60%/30% → pool gets 10% + rounding remainder
    const allocs = assignToProjects(
      d('133.3333'),
      'person-1',
      [
        assignment('person-1', 'proj-A', '60', '2026-01-01', null),
        assignment('person-1', 'proj-B', '30', '2026-01-01', null),
      ],
      JAN_2026,
    )
    expect(sumAllocations(allocs).toFixed(4)).toBe('133.3333')
  })

  it('sets personId on all returned allocations', () => {
    const allocs = assignToProjects(
      d('100.0000'),
      'person-42',
      [assignment('person-42', 'proj-X', '100', '2026-01-01', null)],
      JAN_2026,
    )
    for (const a of allocs) {
      expect(a.personId).toBe('person-42')
    }
  })

  it('ignores assignments that fall entirely outside the period', () => {
    const allocs = assignToProjects(
      d('100.0000'),
      'person-1',
      [
        assignment('person-1', 'proj-A', '100', '2025-10-01', '2025-12-31'), // before period
        assignment('person-1', 'proj-B', '100', '2026-03-01', null),          // after period
      ],
      JAN_2026,
    )
    // Both assignments outside period → entire cost to pool
    expect(allocs).toHaveLength(1)
    expect(allocs[0]?.projectId).toBeNull()
    expect(allocs[0]?.allocatedCost.toFixed(4)).toBe('100.0000')
  })

  it('handles zero owner cost without errors', () => {
    const allocs = assignToProjects(
      d('0.0000'),
      'person-1',
      [assignment('person-1', 'proj-A', '100', '2026-01-01', null)],
      JAN_2026,
    )
    expect(sumAllocations(allocs).toFixed(4)).toBe('0.0000')
  })
})
