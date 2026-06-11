import { useState, useRef } from 'react'

interface ImportResult {
  imported: number
  skipped: number
}

export function ConsumptionImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setResult(null)
    setError(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (!dropped.name.toLowerCase().endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv')
      return
    }
    setFile(dropped)
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = sessionStorage.getItem('access_token')
      const res = await fetch('/api/v1/consumptions/import', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Error ${res.status}`)
      }

      const data = (await res.json()) as ImportResult
      setResult(data)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="import-heading">
      <h2 id="import-heading" className="text-xl font-semibold mb-2">
        Importar consumos (PAY_PER_TOKEN)
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Sube un archivo CSV con los consumos de token de las cuentas de tipo PAY_PER_TOKEN. Las filas con datos inválidos se omiten automáticamente.
      </p>

      <details className="mb-5 text-xs text-gray-500 border border-gray-200 rounded p-3">
        <summary className="cursor-pointer font-medium text-gray-600 select-none">
          Formato del CSV esperado
        </summary>
        <div className="mt-2 space-y-1">
          <p>Columnas requeridas (en cualquier orden):</p>
          <code className="block bg-gray-100 px-2 py-1 rounded font-mono">
            account_id, period_start, period_end, total_cost, currency
          </code>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li><code>account_id</code> — UUID de la cuenta de IA</li>
            <li><code>period_start</code> / <code>period_end</code> — fechas en formato YYYY-MM-DD</li>
            <li><code>total_cost</code> — número ≥ 0 (ej. <code>14.23</code>)</li>
            <li><code>currency</code> — código ISO 4217 en mayúsculas (ej. <code>USD</code>)</li>
          </ul>
        </div>
      </details>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div
          role="button"
          tabIndex={0}
          aria-label="Zona de carga de archivo CSV. Haz clic o arrastra un archivo aquí"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-8 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-gray-300 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {file ? (
            <p className="text-sm font-medium text-blue-700">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Arrastra tu archivo CSV aquí</p>
              <p className="text-xs text-gray-400 mt-0.5">o haz clic para seleccionar</p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {loading ? 'Importando…' : 'Importar consumos'}
        </button>
      </form>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 p-4 border rounded-lg space-y-2 max-w-lg"
          aria-label="Resultado de la importación"
        >
          <h3 className="text-sm font-semibold text-gray-700">Resultado</h3>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{result.imported}</p>
              <p className="text-xs text-gray-500">filas importadas</p>
            </div>
            {result.skipped > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{result.skipped}</p>
                <p className="text-xs text-gray-500">filas omitidas</p>
              </div>
            )}
          </div>
          {result.skipped > 0 && (
            <p className="text-xs text-amber-600">
              Las filas omitidas contienen datos inválidos (UUID incorrecto, fechas mal formadas, coste negativo, etc.).
            </p>
          )}
          {result.imported === 0 && result.skipped === 0 && (
            <p className="text-xs text-gray-400">El archivo no contenía filas de datos.</p>
          )}
        </div>
      )}
    </section>
  )
}
