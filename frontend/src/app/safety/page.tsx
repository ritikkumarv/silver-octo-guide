"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import PageTransition from "@/components/UI/PageTransition";
import LiveBadge from "@/components/UI/LiveBadge";
import DataFooter from "@/components/UI/DataFooter";
import { StatSkeleton } from "@/components/UI/Skeletons";
import ErrorState from "@/components/UI/ErrorState";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Dynamic map for incidents
function IncidentMapInner() {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") import("leaflet").then(l => setL(l.default));
  }, []);

  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [32.3792, -86.3077], zoom: 12, preferCanvas: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OSM", subdomains: "abcd", maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Fetch safety map points
    fetch(`${API}/map/points/public_safety`).then(r => r.json()).then((points) => {
      points.forEach((p: any) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:10px;height:10px;background:${p.color};border:2px solid white;border-radius:50%;box-shadow:0 0 8px ${p.color};"></div>`,
          iconSize: [10, 10], iconAnchor: [5, 5],
        });
        L.marker([p.lat, p.lon], { icon }).addTo(map)
          .bindPopup(`<div style="font-family:Inter;"><b style="color:white;">${p.name}</b><br/><span style="font-size:11px;color:#94a3b8;">${p.description?.substring(0, 100)}...</span></div>`);
      });
    }).catch(() => {});

    // Add simulated incident markers
    const incidents = [
      { lat: 32.385, lon: -86.310, color: "#ef4444", label: "Fire/Rescue" },
      { lat: 32.370, lon: -86.295, color: "#3b82f6", label: "Police" },
      { lat: 32.362, lon: -86.320, color: "#f59e0b", label: "Medical" },
      { lat: 32.390, lon: -86.280, color: "#ef4444", label: "Fire/Rescue" },
    ];
    incidents.forEach(inc => {
      const icon = L.divIcon({
        className: "marker-pulse",
        html: `<div style="width:12px;height:12px;background:${inc.color};border:2px solid white;border-radius:50%;box-shadow:0 0 12px ${inc.color};"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      L.marker([inc.lat, inc.lon], { icon }).addTo(map)
        .bindPopup(`<div style="font-family:Inter;"><b style="color:${inc.color};">${inc.label}</b><br/><span style="color:#94a3b8;font-size:11px;">Active incident</span></div>`);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [L]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: 340 }} />
      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-mgm-card/90 backdrop-blur-sm border border-mgm-border rounded-lg px-3 py-2">
        <p className="text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Map Legend</p>
        {[
          { color: "bg-mgm-danger", label: "Fire / Rescue" },
          { color: "bg-mgm-accent", label: "Police Activity" },
          { color: "bg-mgm-warning", label: "Medical Emergency" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2 py-0.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-[10px] text-slate-300">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const IncidentMap = dynamic(() => Promise.resolve(IncidentMapInner), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-mgm-card flex items-center justify-center" style={{ minHeight: 340 }}><div className="w-8 h-8 border-4 border-mgm-accent/30 border-t-mgm-accent rounded-full animate-spin" /></div>,
});

export default function SafetyPage() {
  const [safetyData, setSafetyData] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch(`${API}/datasets/public_safety`)
        .then(r => r.json())
        .then(d => { setSafetyData(d.data || []); }),
      fetch(`${API}/safety/overview`)
        .then(r => r.json())
        .then(d => { setOverview(d); }),
    ]).then(() => setLoading(false)).catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const mpd = safetyData.find(d => d.officers);
  const fire = safetyData.find(d => d.firefighters);
  const crime = safetyData.find(d => d.property_crime_change);
  const cameras = safetyData.find(d => d.cameras_installed);
  const emergency = safetyData.find(d => d.shelter_locations);

  // Derive total incidents from live 911 call data
  const live911 = overview?.live_data?.emergency_911_calls || 0;
  const liveStations = overview?.live_data?.fire_police_stations || 0;
  const liveShelters = overview?.live_data?.emergency_shelters || 0;
  const totalIncidents = live911 > 0 ? live911 : 128;
  const avgResponseDisplay = overview?.avg_response_minutes
    ? `${overview.avg_response_minutes}m`
    : (emergency?.avg_response_minutes?.emergency || "5m 12s");

  const stats = [
    {
      icon: "⏱️", label: "Avg Response Time",
      value: avgResponseDisplay,
      sub: "-15%", subColor: "text-mgm-success", progress: 85, progressColor: "bg-mgm-accent",
    },
    {
      icon: "👥", label: "Active Units",
      value: `${overview?.officers || mpd?.officers || 500}`,
      sub: "Live", subColor: "text-slate-400", progress: 0, progressColor: "",
      badges: [
        { label: `POLICE: ${mpd?.precincts || overview?.precincts || 4}`, color: "bg-mgm-accent" },
        { label: `FIRE: ${liveStations || fire?.stations || 10}`, color: "bg-mgm-danger" },
        { label: `SHELTERS: ${liveShelters || 8}`, color: "bg-mgm-success" },
      ],
    },
    {
      icon: "📊", label: "Total Incidents",
      value: totalIncidents.toString(), sub: live911 > 0 ? "Live 911" : "+12%", subColor: live911 > 0 ? "text-mgm-accent" : "text-mgm-danger", progress: 0, progressColor: "",
      detail: live911 > 0 ? `911 CALLS: ${live911} | STATIONS: ${liveStations}` : "VS 7-DAY AVERAGE: 114",
    },
    {
      icon: "✅", label: "Safety Score",
      value: `${overview?.safety_score || 88}/100`, sub: "+2%", subColor: "text-mgm-success", progress: overview?.safety_score || 88, progressColor: "bg-mgm-success",
    },
  ];

  // Build live alerts from safety dataset when 911 records exist
  const alertRecords = safetyData.filter(d => d._dataset === "911_calls" || d.incident_type).slice(0, 4);
  const liveAlerts = alertRecords.length > 0
    ? alertRecords.map((r: any, i: number) => ({
        icon: i === 0 ? "🔺" : i === 1 ? "🚧" : i === 2 ? "ℹ️" : "🏥",
        title: r.incident_type || r.name || "Active Incident",
        desc: r.description || r.location || "Montgomery, AL",
        time: r.timestamp || "RECENT",
        color: i === 0 ? "border-mgm-danger" : i === 1 ? "border-mgm-warning" : i === 2 ? "border-mgm-accent" : "border-slate-600",
      }))
    : [
        { icon: "🔺", title: "Structure Fire: 400 Blk Forest Ave", desc: "4 Engines, 2 Ladders responding. Avoid area.", time: "2 MINS AGO", color: "border-mgm-danger" },
        { icon: "🚧", title: "Traffic Delay: I-85 NB @ Mulberry", desc: "Major accident reported. Right lanes blocked.", time: "15 MINS AGO", color: "border-mgm-warning" },
        { icon: "ℹ️", title: "Police Activity: Downtown Plaza", desc: "Crowd control in place for scheduled public event.", time: "42 MINS AGO", color: "border-mgm-accent" },
        { icon: "🏥", title: "EMS Call: Regional Mall", desc: "Medical assistance requested near south entrance.", time: "1 HOUR AGO", color: "border-slate-600" },
      ];

  // Activity trend derived from live data count or fallback
  const baseActivity = live911 > 0 ? Math.round(live911 / 24) : 6;
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const factor = i < 5 ? 0.3 : i < 8 ? 0.7 : i < 12 ? 1.0 : i < 17 ? 0.9 : i < 21 ? 1.4 : 1.1;
    return Math.max(0, Math.round(baseActivity * factor + Math.sin(i) * 2));
  });

  return (
    <PageTransition>
    <div className="min-h-screen bg-mgm-bg">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-mgm-border gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white">Public Safety & Emergency Response</h1>
          <span className="badge badge-success">● SYSTEM STATUS: ACTIVE</span>
          <LiveBadge compact />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-mgm-card border border-mgm-border rounded-lg text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.5"/></svg>
            Feb 27, 2026 - Mar 5, 2026
          </div>
          <button className="w-8 h-8 rounded-full bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400 hover:text-white transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.5"/></svg>
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        {error && <ErrorState message="Failed to load safety data" onRetry={fetchData} />}

        {/* Stat Cards */}
        {loading ? <StatSkeleton /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base">{s.icon}</span>
                {s.sub && <span className={`text-xs font-bold ${s.subColor}`}>{s.sub}</span>}
              </div>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              {s.badges && (
                <div className="flex gap-1.5 mt-2">
                  {s.badges.map(b => (
                    <span key={b.label} className={`text-[9px] px-2 py-0.5 rounded text-white font-bold ${b.color}`}>{b.label}</span>
                  ))}
                </div>
              )}
              {s.detail && <p className="text-[10px] text-slate-500 mt-1">{s.detail}</p>}
              {s.progress > 0 && (
                <div className="progress-bar mt-2">
                  <div className={`progress-bar-fill ${s.progressColor}`} style={{ width: `${s.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Map + Live Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <div className="mgm-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-mgm-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-mgm-accent animate-pulse" />
                  <span className="text-sm font-bold text-white">Montgomery Real-time Incident Map</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs bg-mgm-card-hover border border-mgm-border rounded-lg text-slate-400 hover:text-white transition">Satellite</button>
                  <button className="px-3 py-1.5 text-xs bg-mgm-accent text-white rounded-lg hover:bg-mgm-accent-dark transition">Heatmap</button>
                </div>
              </div>
              <div className="h-[360px] relative">
                {/* Search */}
                <div className="absolute top-3 left-3 z-[1000]">
                  <input
                    placeholder="Search location..."
                    className="bg-mgm-card/90 border border-mgm-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 w-[200px] focus:outline-none"
                  />
                </div>
                <IncidentMap />
              </div>
            </div>
          </div>

          {/* Live Alerts Feed */}
          <div className="lg:col-span-4">
            <div className="mgm-card p-4 h-full">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Live Alerts Feed</h3>
              <div className="space-y-3">
                {liveAlerts.map((a, i) => (
                  <div key={i} className={`border-l-2 ${a.color} pl-3 py-1`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{a.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{a.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{a.desc}</p>
                        <p className="text-[9px] text-slate-600 mt-1">{a.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-xs text-mgm-accent font-semibold hover:underline">
                VIEW ALL ALERTS
              </button>
            </div>
          </div>
        </div>

        {/* Bottom 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Crime Breakdown */}
          <div className="mgm-card p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Crime Type Breakdown</h3>
            <div className="space-y-3">
              {[
                { type: "Property Crimes", pct: 65, color: "bg-mgm-accent" },
                { type: "Personal Crimes", pct: 22, color: "bg-mgm-danger" },
                { type: "Traffic Violations", pct: 13, color: "bg-mgm-warning" },
              ].map(c => (
                <div key={c.type} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-300">{c.type}</span>
                    <span className="text-xs font-bold text-white">{c.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-bar-fill ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {crime && (
              <div className="mt-4 pt-3 border-t border-mgm-border text-[10px] text-slate-500">
                Property crime: {crime.property_crime_change || "-8%"} • Violent crime: {crime.violent_crime_change || "-3%"}
              </div>
            )}
          </div>

          {/* 24H Activity Trend */}
          <div className="mgm-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">24H Activity Trend</h3>
              <span className="text-[10px] text-slate-500">Peak: 11 PM</span>
            </div>
            <div className="flex items-end gap-[2px] h-[100px]">
              {hourlyActivity.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-sm ${i >= 18 && i <= 21 ? "bg-mgm-accent" : "bg-mgm-accent/30"}`}
                    style={{ height: `${(v / 14) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-slate-600">00:00</span>
              <span className="text-[8px] text-slate-600">06:00</span>
              <span className="text-[8px] text-slate-600">12:00</span>
              <span className="text-[8px] text-slate-600">18:00</span>
              <span className="text-[8px] text-slate-600">23:59</span>
            </div>
          </div>

          {/* Safety Resources */}
          <div className="mgm-card p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Safety Resources</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-mgm-danger/10 border border-mgm-danger/30 rounded-xl text-white hover:bg-mgm-danger/20 transition">
                <span className="text-sm font-semibold">Report an Incident</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-mgm-card-hover border border-mgm-border rounded-xl text-white hover:border-mgm-accent transition">
                <span className="text-sm font-semibold">Emergency Contacts</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="1.5"/></svg>
              </button>
              <div className="px-4 py-3 bg-mgm-card-hover border border-mgm-border rounded-xl">
                <p className="text-xs text-white font-semibold">Emergency: 911</p>
                <p className="text-[10px] text-slate-500 mt-1">Non-Emergency: (334) 625-2831</p>
                <p className="text-[10px] text-slate-500">Surveillance Cameras: {cameras?.cameras_installed || 450}</p>
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
