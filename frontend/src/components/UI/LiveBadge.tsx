"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface PortalStats {
  total_records: number;
  categories: number;
  endpoints: number;
  last_updated: string;
}

export default function LiveBadge({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    fetch(`${API}/portal/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Pulse animation toggle
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <div className="relative flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </div>
      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Live Data</span>
      {stats && (
        <span className="text-[10px] text-emerald-300/70 font-medium">
          {stats.total_records.toLocaleString()} records
        </span>
      )}
    </div>
  );
}
