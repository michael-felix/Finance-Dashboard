interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="card flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-brand-dark"
        >
          Try again
        </button>
      )}
    </div>
  );
}
