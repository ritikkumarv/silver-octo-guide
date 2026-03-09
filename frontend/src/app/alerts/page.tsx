"use client";

import { useState, useEffect } from "react";
import PageTransition from "@/components/UI/PageTransition";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: string;
  timestamp: string;
  read: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "🚨", badge: "bg-mgm-danger" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️", badge: "bg-mgm-warning" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "ℹ️", badge: "bg-blue-500" },
};

const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    title: "Severe Thunderstorm Warning",
    description: "The National Weather Service has issued a severe thunderstorm warning for the Montgomery area until 8:00 PM. Residents are advised to stay indoors and away from windows.",
    severity: "critical",
    category: "Weather",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: "2",
    title: "Water Main Repair — Perry Street",
    description: "City crews are repairing a water main break on S Perry St between Adams Ave and Monroe St. Expect reduced water pressure in the downtown area. Estimated completion: 6 hours.",
    severity: "warning",
    category: "Infrastructure",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
  },
  {
    id: "3",
    title: "Community Center Holiday Hours",
    description: "All Montgomery Community Centers will operate on modified hours this weekend. Check the city website for individual center schedules.",
    severity: "info",
    category: "City Services",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  },
  {
    id: "4",
    title: "Road Closure — Dexter Avenue",
    description: "Dexter Avenue will be closed between N Court St and N Hull St on Saturday for the annual Montgomery Festival of Arts. Detour signs will be posted.",
    severity: "warning",
    category: "Transportation",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
  {
    id: "5",
    title: "New 311 Service Request Portal Launched",
    description: "The city has launched an updated 311 portal for service requests. Residents can now track their requests in real time and receive SMS updates.",
    severity: "info",
    category: "City Services",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    read: true,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/alerts`);
        if (res.ok) {
          const data = await res.json();
          if (data.alerts?.length > 0) {
            setAlerts(
              data.alerts.map((a: any, i: number) => ({
                id: String(i),
                title: a.title || a.headline || "City Alert",
                description: a.description || a.body || "",
                severity: a.severity || (i < 2 ? "warning" : "info"),
                category: a.category || "General",
                timestamp: a.timestamp || new Date().toISOString(),
                read: false,
              }))
            );
            setLoading(false);
            return;
          }
        }
      } catch {}
      // Fallback to mock
      setAlerts(MOCK_ALERTS);
      setLoading(false);
    };
    load();
  }, []);

  const markRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);
  const unreadCount = alerts.filter((a) => !a.read).length;

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-mgm-bg">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-mgm-border">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <span className="text-base font-bold text-white">Alerts & Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-mgm-danger text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={markAllRead}
            className="text-xs text-mgm-accent hover:text-mgm-accent-dark font-semibold transition"
          >
            Mark all read
          </button>
        </header>

        <div className="max-w-3xl mx-auto p-6">
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {(["all", "critical", "warning", "info"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${
                  filter === f
                    ? "bg-mgm-accent text-white"
                    : "bg-mgm-card border border-mgm-border text-slate-400 hover:text-white"
                }`}
              >
                {f === "all" ? `All (${alerts.length})` : f}
              </button>
            ))}
          </div>

          {/* Alert List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-mgm-card animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-3">✅</span>
              <p className="text-white font-semibold">No alerts</p>
              <p className="text-sm text-slate-500">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((alert) => {
                const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
                return (
                  <div
                    key={alert.id}
                    onClick={() => markRead(alert.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${style.bg} ${style.border} ${
                      alert.read ? "opacity-60" : ""
                    } hover:opacity-100`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-bold ${alert.read ? "text-slate-400" : "text-white"}`}>
                            {alert.title}
                          </h3>
                          {!alert.read && <span className="w-2 h-2 rounded-full bg-mgm-accent animate-pulse" />}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-semibold ${style.badge}`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-slate-500">{alert.category}</span>
                          <span className="text-[10px] text-slate-600">{formatTime(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
