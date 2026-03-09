"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageTransition from "@/components/UI/PageTransition";
import LiveBadge from "@/components/UI/LiveBadge";
import DataFooter from "@/components/UI/DataFooter";
import ErrorState from "@/components/UI/ErrorState";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CivicDashboard() {
  const [weather, setWeather] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recData, setRecData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch(`${API}/weather`).then(r => r.json()).then(setWeather).catch(() => null),
      fetch(`${API}/alerts`).then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(() => []),
      fetch(`${API}/datasets/recreation_culture`).then(r => r.json()).then(d => setRecData(d.data || [])).catch(() => []),
    ]).then(() => setLoading(false)).catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date();
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const schedule = [
    { time: "9:00 AM", title: "City Council Meeting", type: "civic", color: "border-mgm-accent" },
    { time: "11:30 AM", title: "Water Bill Due Reminder", type: "alert", color: "border-mgm-warning" },
    { time: "2:00 PM", title: "Art Fair at Old Town", type: "event", color: "border-mgm-success" },
    { time: "5:30 PM", title: "Neighborhood Watch", type: "civic", color: "border-mgm-accent" },
  ];

  const rsvps = [
    { title: "Montgomery Jazz Festival", date: "Mar 15", status: "CONFIRMED", statusColor: "text-mgm-success" },
    { title: "Modern Sculptures Exhibit", date: "Mar 18", status: "PENDING", statusColor: "text-mgm-warning" },
    { title: "Community Garden Meetup", date: "Mar 22", status: "CONFIRMED", statusColor: "text-mgm-success" },
  ];

  const personalAlerts = [
    { icon: "⚡", title: "Scheduled power maintenance on Oak Street", time: "2 hours ago", type: "warning" },
    { icon: "🗳️", title: "Your voter registration has been updated", time: "1 day ago", type: "info" },
    { icon: "📦", title: "Report #MGM-4892 resolved — pothole fixed", time: "2 days ago", type: "success" },
    { icon: "💧", title: "Water bill payment confirmation received", time: "3 days ago", type: "info" },
  ];

  const savedVenues = recData.slice(0, 4).map(v => ({
    name: v.name || "Venue",
    type: v.type || "Attraction",
    visitors: v.annual_visitors ? `${(v.annual_visitors / 1000).toFixed(0)}K visitors/yr` : "",
  }));

  const civicActions = [
    { icon: "🚧", label: "Report Issue", desc: "Potholes, lights, noise", href: "/report" },
    { icon: "📋", label: "Renew License", desc: "Business permits", href: "#" },
    { icon: "🎫", label: "View Tickets", desc: "Parking & events", href: "#" },
    { icon: "📊", label: "View Budget", desc: "City transparency", href: "#" },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-mgm-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-mgm-border">
        <div className="flex items-center gap-3">
          <span className="text-lg">📊</span>
          <span className="text-base font-bold text-white">Civic Dashboard</span>
          <span className="badge badge-info text-[10px]">ACTIVE RESIDENT</span>
          <LiveBadge compact />
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400 text-sm">⚙️</button>
          <button className="w-8 h-8 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400 text-sm relative">
            🔔
            {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-mgm-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">{Math.min(alerts.length, 9)}</span>}
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6">
        {error && <ErrorState message="Failed to load civic data" onRetry={fetchData} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sidebar - User Profile */}
          <div className="lg:col-span-3 space-y-5">
            {/* Profile Card */}
            <div className="mgm-card p-5">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mgm-accent to-blue-600 flex items-center justify-center text-2xl mb-3">
                  👤
                </div>
                <h2 className="text-lg font-bold text-white">John Doe</h2>
                <p className="text-xs text-slate-400 mt-0.5">Capitol Heights Neighborhood</p>
                <span className="badge badge-success text-[9px] mt-2">Active Resident</span>
              </div>
              <div className="mt-5 pt-4 border-t border-mgm-border space-y-3">
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-500">Member Since</span>
                  <span className="text-[11px] text-white font-medium">Jan 2022</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-500">Reports Filed</span>
                  <span className="text-[11px] text-white font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-500">Events Attended</span>
                  <span className="text-[11px] text-white font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-500">Civic Score</span>
                  <span className="text-[11px] text-mgm-accent font-bold">92/100</span>
                </div>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="mgm-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🌤️</span>
                <span className="text-xs font-bold text-white">Montgomery Weather</span>
              </div>
              {weather ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-white">{weather.temperature || weather.temp || "72"}°F</p>
                    <p className="text-[10px] text-slate-500">{weather.condition || weather.description || "Partly Cloudy"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Humidity: {weather.humidity || "58"}%</p>
                    <p className="text-[10px] text-slate-500">Wind: {weather.wind_speed || "8"} mph</p>
                  </div>
                </div>
              ) : (
                <div className="skeleton h-12 rounded-lg" />
              )}
            </div>

            {/* Quick Actions */}
            <div className="mgm-card p-4">
              <h3 className="text-xs font-bold text-white mb-3">Civic Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {civicActions.map(a => (
                  <Link key={a.label} href={a.href} className="p-3 rounded-lg bg-mgm-card-hover hover:bg-mgm-border transition text-center group cursor-pointer">
                    <span className="text-lg block mb-1">{a.icon}</span>
                    <p className="text-[11px] font-bold text-white group-hover:text-mgm-accent transition">{a.label}</p>
                    <p className="text-[9px] text-slate-500">{a.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-5">
            {/* My Schedule */}
            <div className="mgm-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <h2 className="text-base font-bold text-white">My Schedule</h2>
                  <span className="text-xs text-slate-500">— {monthNames[today.getMonth()]} {today.getFullYear()}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-mgm-accent text-white rounded-lg text-xs font-medium">Day</button>
                  <button className="px-3 py-1.5 bg-mgm-card-hover text-slate-400 rounded-lg text-xs hover:text-white transition">Week</button>
                  <button className="px-3 py-1.5 bg-mgm-card-hover text-slate-400 rounded-lg text-xs hover:text-white transition">Month</button>
                </div>
              </div>

              {/* Week Strip */}
              <div className="flex gap-2 mb-5 overflow-x-auto">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(today);
                  d.setDate(today.getDate() - today.getDay() + i);
                  const isToday = d.getDate() === today.getDate();
                  return (
                    <button
                      key={i}
                      className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-center transition ${
                        isToday
                          ? "bg-mgm-accent text-white"
                          : "bg-mgm-card-hover text-slate-400 hover:text-white"
                      }`}
                    >
                      <p className="text-[9px] font-bold uppercase">{dayNames[i]}</p>
                      <p className="text-lg font-black mt-0.5">{d.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              {/* Schedule Items */}
              <div className="space-y-3">
                {schedule.map((s, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl bg-mgm-card-hover border-l-2 ${s.color}`}>
                    <span className="text-xs text-slate-500 w-16 font-mono flex-shrink-0">{s.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{s.title}</p>
                    </div>
                    <button className="text-xs text-mgm-accent font-semibold hover:underline flex-shrink-0">View</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Upcoming RSVPs */}
              <div className="mgm-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎫</span>
                    <h3 className="text-sm font-bold text-white">Upcoming RSVPs</h3>
                  </div>
                  <button className="text-xs text-mgm-accent font-semibold">View All</button>
                </div>
                <div className="space-y-3">
                  {rsvps.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-mgm-card-hover">
                      <div>
                        <p className="text-sm font-medium text-white">{r.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{r.date}</p>
                      </div>
                      <span className={`text-[10px] font-bold ${r.statusColor}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Alerts */}
              <div className="mgm-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔔</span>
                    <h3 className="text-sm font-bold text-white">Personalized Alerts</h3>
                  </div>
                  <button className="text-xs text-mgm-accent font-semibold">Mark All Read</button>
                </div>
                <div className="space-y-3">
                  {personalAlerts.map((a, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-mgm-card-hover">
                      <span className="text-base flex-shrink-0">{a.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] text-white leading-snug">{a.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Venues */}
            <div className="mgm-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <h3 className="text-sm font-bold text-white">Saved Venues & Parks</h3>
                </div>
                <Link href="/culture" className="text-xs text-mgm-accent font-semibold">Explore More</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {savedVenues.length > 0 ? savedVenues.map((v, i) => (
                  <div key={i} className="p-3 rounded-xl bg-mgm-card-hover hover:bg-mgm-border transition cursor-pointer">
                    <div className="w-full h-20 bg-gradient-to-br from-mgm-border to-mgm-card-hover rounded-lg flex items-center justify-center mb-2">
                      <span className="text-2xl opacity-30">🏛️</span>
                    </div>
                    <p className="text-[11px] font-bold text-white truncate">{v.name}</p>
                    <p className="text-[9px] text-slate-500">{v.type} {v.visitors && `• ${v.visitors}`}</p>
                  </div>
                )) : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-[120px] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DataFooter />
      </div>
    </div>
    </PageTransition>
  );
}
