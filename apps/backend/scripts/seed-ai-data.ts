/**
 * Seed script: inserts AI providers, pricing plans, and active accounts.
 *
 * Run once:
 *   pnpm --filter backend exec tsx --env-file=.env scripts/seed-ai-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
)

// ─── Providers ────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'Anthropic' },
  { name: 'OpenAI' },
  { name: 'Google' },
  { name: 'xAI' },
  { name: 'Cursor' },
  { name: 'Antigravity' },
]

// ─── Plans ────────────────────────────────────────────────────────────────────
//
// unit_price = coste por UNIDAD (la unidad la decide el usuario en la forma).
// Para suscripciones usamos: tipo PER_SEAT, unit_price = precio mensual.
//   → el usuario introduce "0.25" para una semana, "1" para un mes completo.
// Para APIs de pago por tokens: unit_price = coste por 1.000 tokens (aprox).
//   → el usuario introduce "1000" para ~1M tokens.
//
// Todos los precios en EUR. Conversiones a tipo de cambio orientativo.

const PLANS_BY_PROVIDER: Record<
  string,
  Array<{
    name: string
    type: 'PER_SEAT' | 'POOL_SLOT' | 'PAY_PER_TOKEN' | 'VOLUME_TIER'
    unit_price: number
    currency: string
    effective_from: string
  }>
> = {
  Anthropic: [
    {
      name: 'Claude Pro (suscripción)',
      type: 'PER_SEAT',
      unit_price: 20.00,   // €20/mes por usuario
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Claude API – Sonnet 4',
      type: 'PAY_PER_TOKEN',
      unit_price: 0.0030,  // €3 por 1M tokens ≈ €0.003 por 1K tokens
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Claude API – Opus 4',
      type: 'PAY_PER_TOKEN',
      unit_price: 0.0140,  // €14 por 1M tokens ≈ €0.014 por 1K tokens
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
  ],
  OpenAI: [
    {
      name: 'ChatGPT Plus (suscripción)',
      type: 'PER_SEAT',
      unit_price: 20.00,   // $20/mes ≈ €20
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'ChatGPT Team (suscripción)',
      type: 'PER_SEAT',
      unit_price: 30.00,   // $30/mes/usuario ≈ €28 → redondeo €30
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'OpenAI API – GPT-4o',
      type: 'PAY_PER_TOKEN',
      unit_price: 0.0025,  // $2.50 por 1M tokens ≈ €0.0025 por 1K tokens
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'OpenAI API – o3',
      type: 'PAY_PER_TOKEN',
      unit_price: 0.0100,  // ~$10 por 1M tokens ≈ €0.010 por 1K tokens
      currency: 'EUR',
      effective_from: '2025-01-01',
    },
  ],
  Google: [
    {
      name: 'Gemini Advanced (suscripción)',
      type: 'PER_SEAT',
      unit_price: 21.99,   // €21.99/mes (Google One AI Premium)
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Google Workspace + Gemini Business',
      type: 'PER_SEAT',
      unit_price: 24.00,   // ~€24/usuario/mes
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Gemini API – Flash 2.0',
      type: 'PAY_PER_TOKEN',
      unit_price: 0.0001,  // $0.10 por 1M tokens ≈ muy barato
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
  ],
  xAI: [
    {
      name: 'Grok Premium (suscripción)',
      type: 'PER_SEAT',
      unit_price: 14.00,   // ~$16/mes ≈ €14
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Grok Premium+ (suscripción)',
      type: 'PER_SEAT',
      unit_price: 28.00,   // ~$30/mes ≈ €28
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
  ],
  Cursor: [
    {
      name: 'Cursor Hobby (gratuito)',
      type: 'PER_SEAT',
      unit_price: 0.00,    // free tier
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Cursor Pro (suscripción)',
      type: 'PER_SEAT',
      unit_price: 20.00,   // $20/mes ≈ €20
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Cursor Business (suscripción)',
      type: 'PER_SEAT',
      unit_price: 40.00,   // $40/usuario/mes ≈ €40
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
  ],
  Antigravity: [
    {
      name: 'Antigravity Pro (suscripción)',
      type: 'PER_SEAT',
      unit_price: 15.00,
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
    {
      name: 'Antigravity Enterprise',
      type: 'PER_SEAT',
      unit_price: 50.00,
      currency: 'EUR',
      effective_from: '2024-01-01',
    },
  ],
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
// One representative account per main plan, currently active (valid_to = null).

const ACCOUNTS_BY_PLAN: Record<string, Array<{ external_identifier: string; valid_from: string }>> = {
  'Claude Pro (suscripción)': [
    { external_identifier: 'claude-pro@empresa.com', valid_from: '2025-01-01' },
  ],
  'Claude API – Sonnet 4': [
    { external_identifier: 'api-key-anthropic-sonnet', valid_from: '2025-01-01' },
  ],
  'Claude API – Opus 4': [
    { external_identifier: 'api-key-anthropic-opus', valid_from: '2025-01-01' },
  ],
  'ChatGPT Plus (suscripción)': [
    { external_identifier: 'chatgpt-plus@empresa.com', valid_from: '2025-01-01' },
  ],
  'ChatGPT Team (suscripción)': [
    { external_identifier: 'openai-team@empresa.com', valid_from: '2025-01-01' },
  ],
  'OpenAI API – GPT-4o': [
    { external_identifier: 'api-key-openai-gpt4o', valid_from: '2025-01-01' },
  ],
  'OpenAI API – o3': [
    { external_identifier: 'api-key-openai-o3', valid_from: '2025-01-01' },
  ],
  'Gemini Advanced (suscripción)': [
    { external_identifier: 'gemini-advanced@empresa.com', valid_from: '2025-01-01' },
  ],
  'Google Workspace + Gemini Business': [
    { external_identifier: 'workspace-gemini@empresa.com', valid_from: '2025-01-01' },
  ],
  'Gemini API – Flash 2.0': [
    { external_identifier: 'api-key-gemini-flash', valid_from: '2025-01-01' },
  ],
  'Grok Premium (suscripción)': [
    { external_identifier: 'grok-premium@empresa.com', valid_from: '2025-01-01' },
  ],
  'Grok Premium+ (suscripción)': [
    { external_identifier: 'grok-premium-plus@empresa.com', valid_from: '2025-01-01' },
  ],
  'Cursor Pro (suscripción)': [
    { external_identifier: 'cursor-pro@empresa.com', valid_from: '2025-01-01' },
  ],
  'Cursor Business (suscripción)': [
    { external_identifier: 'cursor-business@empresa.com', valid_from: '2025-01-01' },
  ],
  'Antigravity Pro (suscripción)': [
    { external_identifier: 'antigravity-pro@empresa.com', valid_from: '2025-01-01' },
  ],
  'Antigravity Enterprise': [
    { external_identifier: 'antigravity-enterprise@empresa.com', valid_from: '2025-01-01' },
  ],
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Insertando proveedores…')

  const providerIdMap = new Map<string, string>()

  for (const prov of PROVIDERS) {
    // Upsert by name so re-running the script is idempotent
    const { data, error } = await supabase
      .from('ai_provider')
      .upsert({ name: prov.name }, { onConflict: 'name' })
      .select('id, name')
      .single()

    if (error) {
      console.error(`  ✗ ${prov.name}: ${error.message}`)
      continue
    }
    providerIdMap.set(prov.name, (data as { id: string }).id)
    console.log(`  ✓ Proveedor: ${prov.name}`)
  }

  console.log('\nInsertando planes de precios…')

  const planIdMap = new Map<string, string>()

  for (const [providerName, plans] of Object.entries(PLANS_BY_PROVIDER)) {
    const providerId = providerIdMap.get(providerName)
    if (!providerId) {
      console.error(`  ✗ Proveedor no encontrado: ${providerName}`)
      continue
    }

    for (const plan of plans) {
      // Upsert: use provider_id + name as unique key
      const { data: existing } = await supabase
        .from('pricing_plan')
        .select('id')
        .eq('provider_id', providerId)
        .eq('name', plan.name)
        .is('deleted_at', null)
        .maybeSingle()

      let planId: string

      if (existing) {
        planId = (existing as { id: string }).id
        console.log(`  → Ya existe: ${providerName} / ${plan.name}`)
      } else {
        const { data, error } = await supabase
          .from('pricing_plan')
          .insert({
            provider_id: providerId,
            type: plan.type,
            name: plan.name,
            unit_price: plan.unit_price,
            currency: plan.currency,
            effective_from: plan.effective_from,
          })
          .select('id')
          .single()

        if (error) {
          console.error(`  ✗ ${providerName} / ${plan.name}: ${error.message}`)
          continue
        }
        planId = (data as { id: string }).id
        console.log(`  ✓ Plan: ${providerName} / ${plan.name} — €${plan.unit_price}/${plan.type}`)
      }

      planIdMap.set(plan.name, planId)
    }
  }

  console.log('\nInsertando cuentas activas…')

  for (const [planName, accounts] of Object.entries(ACCOUNTS_BY_PLAN)) {
    const planId = planIdMap.get(planName)
    if (!planId) continue

    for (const acc of accounts) {
      const { data: existing } = await supabase
        .from('ai_account')
        .select('id')
        .eq('pricing_plan_id', planId)
        .eq('external_identifier', acc.external_identifier)
        .is('deleted_at', null)
        .maybeSingle()

      if (existing) {
        console.log(`  → Ya existe: ${acc.external_identifier}`)
        continue
      }

      const { error } = await supabase.from('ai_account').insert({
        pricing_plan_id: planId,
        external_identifier: acc.external_identifier,
        valid_from: acc.valid_from,
      })

      if (error) {
        console.error(`  ✗ ${acc.external_identifier}: ${error.message}`)
        continue
      }
      console.log(`  ✓ Cuenta: ${acc.external_identifier} (${planName})`)
    }
  }

  console.log('\n✅ Seed completado.')
  console.log('\n📋 Notas de uso en el formulario:')
  console.log('  • Suscripciones (PER_SEAT): introduce el nº de meses (ej: 1 = un mes, 0.25 = una semana)')
  console.log('  • APIs (PAY_PER_TOKEN): introduce el nº de miles de tokens (ej: 100 = 100K tokens)')
}

seed().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
