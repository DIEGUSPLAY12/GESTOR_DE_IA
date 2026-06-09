interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div role="status" className="py-12 text-center text-gray-400 text-sm">
      {message}
    </div>
  )
}
