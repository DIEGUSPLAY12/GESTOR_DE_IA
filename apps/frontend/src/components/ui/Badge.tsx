type Status = 'OK' | 'WARNING' | 'DANGER'

interface BadgeProps {
  status: Status
}

const config: Record<Status, { label: string; className: string }> = {
  OK: { label: 'OK', className: 'bg-green-100 text-green-800' },
  WARNING: { label: 'Advertencia', className: 'bg-amber-100 text-amber-800' },
  DANGER: { label: 'Peligro', className: 'bg-red-100 text-red-800' },
}

export function StatusBadge({ status }: BadgeProps) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
