import { useState } from 'react'
import { api, ApiError } from '../../../lib/api.js'

function currentPeriodMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function ExportPanel() {
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth())
  const [isExporting, setIsExporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleExport() {
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsExporting(true)

    try {
      const params = new URLSearchParams({ period_month: periodMonth })
      // Use raw fetch so we can handle blob download
      const token = sessionStorage.getItem('access_token')
      const res = await fetch(`/api/v1/reports/export?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
        throw new ApiError(res.status, body.error ?? res.statusText)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `imputaciones_${periodMonth}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMsg(`Exportación de ${periodMonth} descargada correctamente.`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrorMsg('Solo los administradores pueden exportar informes.')
      } else if (err instanceof ApiError && err.status === 0) {
        setErrorMsg('Backend no disponible. Conecta el servidor para exportar.')
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Error al exportar')
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section aria-labelledby="export-panel-heading" className="max-w-lg">
      <h2 id="export-panel-heading" className="text-xl font-semibold mb-6">
        Exportar imputaciones a CSV
      </h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <p className="text-sm text-gray-600">
          Genera un fichero CSV con el detalle completo de las imputaciones calculadas para el
          periodo seleccionado. Disponible solo para administradores.
        </p>

        <div>
          <label htmlFor="export-period" className="block text-sm font-medium text-gray-700 mb-1">
            Periodo
          </label>
          <input
            id="export-period"
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="bg-gray-50 rounded p-3 text-xs text-gray-500">
          <p className="font-medium text-gray-600 mb-1">El CSV incluye:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>ID de imputación y hash de auditoría</li>
            <li>Persona, proyecto, cuenta y proveedor</li>
            <li>Coste imputado y moneda</li>
            <li>Traza de cálculo completa</li>
          </ul>
        </div>

        {errorMsg && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </p>
        )}

        {successMsg && (
          <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {successMsg}
          </p>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 transition-colors"
          aria-busy={isExporting}
        >
          {isExporting ? (
            <>
              <span aria-hidden="true" className="animate-spin">⟳</span>
              Exportando…
            </>
          ) : (
            <>
              Descargar CSV — {periodMonth}
            </>
          )}
        </button>
      </div>
    </section>
  )
}
