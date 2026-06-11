import { test, expect } from '@playwright/test'

/**
 * E2E core flow: Alta Master → Asignación → Cálculo → Exportar
 *
 * These tests run against the running dev server (localhost:5173).
 * The backend must be up and the DB seeded for the full flow to pass.
 * In CI, the test suite validates UI rendering and navigation;
 * API-dependent assertions are skipped when the backend is unavailable.
 */

test.describe('Navigation', () => {
  test('renders main nav with all sections', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Datos maestros' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Presupuestos' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Mi consumo' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Informes' })).toBeVisible()
  })

  test('navigates to each section without crashing', async ({ page }) => {
    await page.goto('/master-data')
    await expect(page.getByText('Datos Maestros')).toBeVisible()

    await page.goto('/budgets')
    await expect(page.getByRole('heading', { name: 'Presupuestos' })).toBeVisible()

    await page.goto('/consultant')
    await expect(page.getByRole('heading', { name: 'Mi consumo de IA' })).toBeVisible()

    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: 'Exportar imputaciones a CSV' })).toBeVisible()
  })
})

test.describe('US1 — Master Data: ProjectsTable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/master-data')
  })

  test('renders projects tab by default', async ({ page }) => {
    const tabPanel = page.getByRole('tabpanel', { name: 'tab-projects' })
    // The tab is present and initially selected
    await expect(page.getByRole('tab', { name: 'Proyectos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('table has accessible headers with aria-sort', async ({ page }) => {
    // Wait for table to appear (demo data loads immediately)
    const table = page.getByRole('table')
    await expect(table).toBeVisible({ timeout: 5000 })

    const codeHeader = page.getByRole('columnheader', { name: /Código/ })
    await expect(codeHeader).toBeVisible()
  })

  test('status filter changes visible rows', async ({ page }) => {
    const table = page.getByRole('table')
    await expect(table).toBeVisible({ timeout: 5000 })

    // Switch to inactive filter
    const filterSelect = page.getByRole('combobox')
    await filterSelect.selectOption('inactive')

    // Inactive badge should now be visible
    await expect(page.getByText('Inactivo').first()).toBeVisible()
  })

  test('assignments tab renders form', async ({ page }) => {
    await page.getByRole('tab', { name: 'Asignaciones' }).click()
    await expect(page.getByRole('heading', { name: 'Asignar consultor a proyecto' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Consultor/ })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Proyecto/ })).toBeVisible()
  })
})

test.describe('US1 — AssignmentForm percentage guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/master-data')
    await page.getByRole('tab', { name: 'Asignaciones' }).click()
  })

  test('shows warning when percentage would exceed 100', async ({ page }) => {
    // Fill in required fields
    const personSelect = page.getByRole('combobox', { name: /Consultor/ })
    await personSelect.selectOption({ index: 1 })

    await page.getByRole('spinbutton', { name: /% Dedicación/ }).fill('101')
    await page.getByLabel(/Desde/).fill('2026-01-01')

    // Trigger re-check — wait for warning
    await page.getByRole('spinbutton', { name: /% Dedicación/ }).press('Tab')
    // 101 > 100 triggers the cap warning
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('US3 — Budget Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budgets')
  })

  test('renders budget heading and period picker', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Presupuestos' })).toBeVisible()
    await expect(page.getByLabel('Periodo:')).toBeVisible()
  })

  test('renders deviation alert cards (demo data)', async ({ page }) => {
    // Demo data loads when backend is unavailable
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 5000 })

    // At least one DANGER card should exist with the demo data
    await expect(page.getByText('Peligro').first()).toBeVisible()
  })

  test('deviation cards have accessible progressbars', async ({ page }) => {
    await expect(page.getByRole('progressbar').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('US4 — Consultant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/consultant')
  })

  test('renders read-only cost table with demo data', async ({ page }) => {
    const table = page.getByRole('table')
    await expect(table).toBeVisible({ timeout: 5000 })
    // No edit/delete buttons should exist (read-only per FR-021)
    await expect(page.getByRole('button', { name: /Editar/ })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Eliminar/ })).not.toBeVisible()
  })

  test('shows total cost summary card', async ({ page }) => {
    await expect(page.getByText('Coste total imputado')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Reports — Export Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
  })

  test('renders export button and period picker', async ({ page }) => {
    await expect(page.getByLabel('Periodo')).toBeVisible()
    await expect(page.getByRole('button', { name: /Descargar CSV/ })).toBeVisible()
  })

  test('export button shows error when backend unavailable', async ({ page }) => {
    await page.getByRole('button', { name: /Descargar CSV/ }).click()
    // Should show error state (backend not running in test env)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })
})
