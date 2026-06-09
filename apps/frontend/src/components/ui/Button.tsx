import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      aria-busy={loading}
      className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass[variant]} ${className}`}
    >
      {loading && (
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
