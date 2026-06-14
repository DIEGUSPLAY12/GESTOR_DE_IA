type Status = 'OK' | 'WARNING' | 'DANGER'

interface BadgeProps {
  status: Status
}

const config: Record<Status, { label: string; className: string }> = {
  OK:      { label: 'OK',          className: 'bg-alten-mid-blue text-alten-dark' },
  WARNING: { label: 'Advertencia', className: 'bg-amber-100 text-amber-800' },
  DANGER:  { label: 'Peligro',     className: 'bg-alten-red text-white' },
}

export function StatusBadge({ status }: BadgeProps) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
