"use client";

export function CardSkeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`mgm-card p-5 animate-pulse ${className}`}>
      <div className="h-3 w-1/3 bg-mgm-card-hover rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-2.5 bg-mgm-card-hover rounded mb-3" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-mgm-card-hover" />
            <div className="w-10 h-3 rounded bg-mgm-card-hover" />
          </div>
          <div className="h-2 w-2/3 bg-mgm-card-hover rounded mb-2" />
          <div className="h-6 w-1/2 bg-mgm-card-hover rounded" />
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="mgm-card overflow-hidden animate-pulse">
      <div className="h-10 bg-mgm-card-hover border-b border-mgm-border" />
      <div className="h-[320px] bg-mgm-card flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-mgm-accent/30 border-t-mgm-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading map data...</p>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mgm-card p-5 animate-pulse">
      <div className="h-4 w-1/4 bg-mgm-card-hover rounded mb-5" />
      <div className="space-y-3">
        {/* Header */}
        <div className="flex gap-4 pb-3 border-b border-mgm-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-2 bg-mgm-card-hover rounded" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex-1 h-3 bg-mgm-card-hover rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="mgm-card p-5 animate-pulse">
      <div className="h-4 w-1/3 bg-mgm-card-hover rounded mb-4" />
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-mgm-card-hover rounded-t-sm"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-mgm-bg p-6 space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-mgm-border">
        <div>
          <div className="h-5 w-48 bg-mgm-card-hover rounded mb-2" />
          <div className="h-3 w-72 bg-mgm-card-hover rounded" />
        </div>
        <div className="h-8 w-32 bg-mgm-card-hover rounded-lg" />
      </div>
      <StatSkeleton />
      <ChartSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  );
}
