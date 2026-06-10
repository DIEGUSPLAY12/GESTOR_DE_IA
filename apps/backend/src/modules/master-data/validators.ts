import { supabase } from '../../lib/supabase.js'

export interface ValidationResult {
  valid: boolean
  currentTotal: number
  message?: string
}

/**
 * Checks that adding `newPercentage` to the given account's existing ownerships
 * (that overlap the proposed date range) would not exceed 100%.
 *
 * Pass `excludeId` when updating an existing record so its current percentage
 * is not double-counted.
 */
export async function validateOwnershipSum(
  accountId: string,
  newPercentage: number,
  validFrom: string,
  validTo: string | null,
  excludeId?: string,
): Promise<ValidationResult> {
  let query = supabase
    .from('account_ownership')
    .select('percentage')
    .eq('account_id', accountId)
    .lte('valid_from', validTo ?? '9999-12-31')
    .or(`valid_to.is.null,valid_to.gte.${validFrom}`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Ownership sum query failed: ${error.message}`)

  const currentTotal = (data ?? []).reduce(
    (sum, row) => sum + Number((row as { percentage: string | number }).percentage),
    0,
  )
  const projected = Math.round((currentTotal + newPercentage) * 100) / 100

  if (projected > 100) {
    return {
      valid: false,
      currentTotal,
      message: `Total ownership would exceed 100% (current: ${currentTotal}%, new: ${newPercentage}%, projected: ${projected}%)`,
    }
  }

  return { valid: true, currentTotal }
}

/**
 * Checks that adding `newPercentage` to the given person's existing project
 * assignments (that overlap the proposed date range) would not exceed 100%.
 */
export async function validateAssignmentSum(
  personId: string,
  newPercentage: number,
  validFrom: string,
  validTo: string | null,
  excludeId?: string,
): Promise<ValidationResult> {
  let query = supabase
    .from('project_assignment')
    .select('percentage')
    .eq('person_id', personId)
    .lte('valid_from', validTo ?? '9999-12-31')
    .or(`valid_to.is.null,valid_to.gte.${validFrom}`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Assignment sum query failed: ${error.message}`)

  const currentTotal = (data ?? []).reduce(
    (sum, row) => sum + Number((row as { percentage: string | number }).percentage),
    0,
  )
  const projected = Math.round((currentTotal + newPercentage) * 100) / 100

  if (projected > 100) {
    return {
      valid: false,
      currentTotal,
      message: `Total allocation would exceed 100% (current: ${currentTotal}%, new: ${newPercentage}%, projected: ${projected}%)`,
    }
  }

  return { valid: true, currentTotal }
}
