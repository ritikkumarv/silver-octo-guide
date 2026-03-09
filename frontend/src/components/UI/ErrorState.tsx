"use client";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorState({
  message = "Failed to load data",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-mgm-danger/10 border border-mgm-danger/20 rounded-lg">
        <svg className="w-3.5 h-3.5 text-mgm-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path d="M12 8v4m0 4h.01" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[11px] text-mgm-danger">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="text-[10px] text-mgm-accent font-semibold hover:underline ml-auto">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mgm-card p-8 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-mgm-danger/10 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-mgm-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path d="M12 8v4m0 4h.01" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-white mb-1">{message}</p>
      <p className="text-xs text-slate-500 mb-4">Please check your connection and try again</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-mgm-accent text-white rounded-lg text-xs font-semibold hover:bg-mgm-accent-dark transition flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
