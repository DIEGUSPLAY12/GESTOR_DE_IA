interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div role="alert" aria-live="assertive" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}
