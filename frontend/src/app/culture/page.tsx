"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageTransition from "@/components/UI/PageTransition";
import LiveBadge from "@/components/UI/LiveBadge";
import DataFooter from "@/components/UI/DataFooter";
import ErrorState from "@/components/UI/ErrorState";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CulturePage() {
  const [recData, setRecData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch(`${API}/datasets/recreation_culture`).then(r => r.json()).then(d => { setRecData(d.data || []); }).catch(() => {}),
      fetch(`${API}/datasets/historical_markers`).then(r => r.json()).then(d => { setHistoricalData(d.data || []); }).catch(() => {}),
    ]).then(() => setLoading(false)).catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const museums = recData.filter(d => d.type === "Museum");
  const theatre = recData.find(d => d.name?.includes("Shakespeare"));
  const zoo = recData.find(d => d.name?.includes("Zoo"));
  const parks = recData.find(d => d.total_parks);
  const blount = recData.find(d => d.name?.includes("Blount"));
  const arts = recData.find(d => d.name?.includes("Arts Program") || d.name?.includes("Cultural Arts"));

  // Calendar data
  const today = 12;
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const eventDays = [12, 15, 18, 22, 25];
  const workshopDays = [18, 22];

  const upcomingEvents = [
    { day: 8, month: "MAR", title: "Annual Art Fair", location: "Old Town Square • 10:00 AM", action: "RSVP →", color: "text-mgm-accent" },
    { day: 12, month: "MAR", title: "Modern Sculptures", location: "Fine Arts Museum • 2:00 PM", action: "Details →", color: "text-mgm-accent" },
    { day: 18, month: "MAR", title: "Opera in the Park", location: "Shakespeare Garden • 7:30 PM", action: "Tickets →", color: "text-mgm-danger" },
    { day: 22, month: "MAR", title: "Pottery Workshop", location: "Community Center • 6:00 PM", action: "Join →", color: "text-mgm-success" },
  ];

  const venues = [
    {
      name: museums[0]?.name || "Museum of Fine Arts",
      tag: "MUSEUM",
      tagColor: "bg-mgm-accent",
      desc: museums[0]?.description?.substring(0, 60) || "One Museum Drive",
      visitors: museums[0]?.annual_visitors || 120000,
    },
    {
      name: theatre?.name || "Alabama Shakespeare Festival",
      tag: "THEATER",
      tagColor: "bg-mgm-purple",
      desc: theatre?.location || "Festival Drive",
      visitors: theatre?.annual_visitors || 300000,
    },
  ];

  const workshops = [
    { name: "Watercolor Basics", when: "Tuesdays, 6:00 PM", price: "$25", action: "Join Now" },
    { name: "Guitar Foundations", when: "Wednesdays, 5:00 PM", price: "Free", action: "Join Now" },
    { name: "Ceramic Throwing", when: "Saturdays, 10:00 AM", price: "$40", action: "Join Now" },
    { name: "Modern Art Critique", when: "Monthly Meetup", price: "Free", action: "Join Now" },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-mgm-bg">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-mgm-border gap-3">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎭</span>
            <span className="text-base font-bold text-white">Montgomery Cultural Hub</span>
            <LiveBadge compact />
          </div>
          <nav className="hidden sm:flex items-center gap-4">
            {["Festivals", "Venues", "Workshops", "Calendar"].map(t => (
              <button key={t} className="text-xs text-slate-400 hover:text-white transition">{t}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search events or venues"
            className="bg-mgm-card border border-mgm-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 w-[200px] focus:outline-none focus:border-mgm-accent"
          />
          <button className="w-8 h-8 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400">📅</button>
          <button className="w-8 h-8 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400">🔔</button>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-6">
        {error && <ErrorState message="Failed to load culture data" onRetry={fetchData} />}

        {/* Hero Banner */}
        <div className="relative h-[220px] rounded-2xl overflow-hidden bg-gradient-to-r from-mgm-accent-dark/60 via-mgm-accent/30 to-transparent border border-mgm-border">
          <div className="absolute inset-0 bg-gradient-to-t from-mgm-bg/80 to-transparent" />
          <div className="relative z-10 p-8 flex flex-col justify-end h-full">
            <span className="badge badge-danger w-fit mb-2 text-[10px]">FEATURED FESTIVAL</span>
            <h1 className="text-3xl font-black text-white mb-2">Montgomery Jazz Festival 2026</h1>
            <p className="text-sm text-slate-300 max-w-lg mb-4">
              Join us for three days of world-class jazz, soul, and blues at the historic Riverfront Park. Featuring over 40 international artists.
            </p>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-mgm-accent text-white rounded-lg text-sm font-semibold hover:bg-mgm-accent-dark transition flex items-center gap-2">
                🎫 Get Tickets
              </button>
              <button className="px-5 py-2.5 bg-mgm-card border border-mgm-border text-white rounded-lg text-sm font-medium hover:bg-mgm-card-hover transition">
                View Lineup
              </button>
            </div>
          </div>
        </div>

        {/* Events + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Upcoming Events */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Upcoming Events</h2>
              <div className="flex gap-2">
                <button className="w-7 h-7 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400 hover:text-white text-xs">←</button>
                <button className="w-7 h-7 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-slate-400 hover:text-white text-xs">→</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {upcomingEvents.map((e) => (
                <div key={e.title} className="mgm-card p-4 flex gap-3 hover:border-mgm-accent/50 transition cursor-pointer">
                  <div className="text-center flex-shrink-0">
                    <p className="text-[10px] text-mgm-accent font-bold uppercase">{e.month}</p>
                    <p className="text-2xl font-black text-white">{e.day}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{e.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{e.location}</p>
                    <button className={`text-xs font-semibold mt-2 ${e.color}`}>{e.action}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-5">
            <div className="mgm-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📅</span>
                <h3 className="text-sm font-bold text-white">Calendar View</h3>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map(d => (
                  <span key={d} className="text-[9px] text-slate-500 font-semibold">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(d => {
                  const isToday = d === today;
                  const isEvent = eventDays.includes(d);
                  const isWorkshop = workshopDays.includes(d);
                  return (
                    <button
                      key={d}
                      className={`h-7 rounded text-xs font-medium transition ${
                        isToday
                          ? "bg-mgm-accent text-white"
                          : isEvent
                          ? "bg-mgm-accent/20 text-mgm-accent"
                          : "text-slate-400 hover:bg-mgm-card-hover"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-mgm-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-mgm-accent" />
                  <span className="text-[10px] text-slate-400">Major Events</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-mgm-purple" />
                  <span className="text-[10px] text-slate-400">Workshops & Classes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cultural Venues */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Cultural Venues</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {venues.map((v) => (
              <div key={v.name} className="mgm-card overflow-hidden group cursor-pointer hover:border-mgm-accent/50 transition">
                <div className="h-[140px] bg-gradient-to-br from-mgm-card-hover to-mgm-card relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-20">🏛️</span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-white ${v.tagColor}`}>{v.tag}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white group-hover:text-mgm-accent transition">{v.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">📍 {v.desc?.substring(0, 50)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{v.visitors?.toLocaleString()} annual visitors</p>
                </div>
              </div>
            ))}
            {/* Explore All Card */}
            <div className="mgm-card overflow-hidden bg-gradient-to-br from-mgm-accent/10 to-transparent flex flex-col items-center justify-center p-6 cursor-pointer hover:border-mgm-accent/50 transition">
              <div className="w-12 h-12 rounded-xl bg-mgm-accent/20 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-mgm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeWidth="1.5"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-mgm-accent">Explore Full City Map</p>
              <p className="text-[10px] text-slate-500 mt-1">Discover {historicalData.length + recData.length}+ venues</p>
              <p className="text-[10px] text-mgm-accent mt-1">📍 Open Interactive Map</p>
            </div>
          </div>
        </div>

        {/* Community Workshops */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Community Workshops</h2>
              <p className="text-xs text-slate-500">Enhance your skills with local masters and artists.</p>
            </div>
            <button className="px-4 py-2 bg-mgm-card border border-mgm-border rounded-lg text-xs text-white font-medium hover:border-mgm-accent transition">
              Browse All Classes
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {workshops.map((w) => (
              <div key={w.name} className="mgm-card overflow-hidden hover:border-mgm-accent/50 transition cursor-pointer">
                <div className="h-[100px] bg-gradient-to-br from-mgm-card-hover to-mgm-card flex items-center justify-center">
                  <span className="text-3xl opacity-20">🎨</span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-white">{w.name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{w.when}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-sm font-bold ${w.price === "Free" ? "text-mgm-success" : "text-white"}`}>{w.price}</span>
                    <button className="text-xs text-mgm-accent font-semibold">{w.action}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="mgm-card p-8 bg-gradient-to-r from-mgm-accent/15 via-mgm-accent/5 to-transparent">
            <h2 className="text-2xl font-black text-white mb-2">Plan Your Perfect Cultural Weekend</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-sm">
              Not sure where to start? Use our interactive planner to find events based on your interests and create a custom itinerary.
            </p>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-mgm-accent text-white rounded-lg text-sm font-semibold hover:bg-mgm-accent-dark transition">
                Start Planning
              </button>
              <button className="px-5 py-2.5 bg-mgm-card border border-mgm-border text-white rounded-lg text-sm font-medium hover:bg-mgm-card-hover transition">
                Group Bookings
              </button>
            </div>
          </div>
          <div className="mgm-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Quick Ticketing</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Select Category</label>
                <select className="w-full mt-1 bg-mgm-card-hover border border-mgm-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-mgm-accent">
                  <option>All Art Festivals</option>
                  <option>Museum Exhibits</option>
                  <option>Theatre Performances</option>
                  <option>Outdoor Events</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Visit Date</label>
                <input type="date" className="w-full mt-1 bg-mgm-card-hover border border-mgm-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-mgm-accent" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Number of Visitors</label>
                <div className="flex items-center mt-1 gap-3">
                  <button className="w-8 h-8 rounded-lg bg-mgm-card-hover border border-mgm-border text-white hover:bg-mgm-border transition">−</button>
                  <span className="text-lg font-bold text-white w-12 text-center">2</span>
                  <button className="w-8 h-8 rounded-lg bg-mgm-card-hover border border-mgm-border text-white hover:bg-mgm-border transition">+</button>
                </div>
              </div>
              <button className="w-full py-3 bg-mgm-card-hover border border-mgm-border rounded-xl text-white text-sm font-semibold hover:bg-mgm-border transition mt-2">
                Check Availability
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-mgm-border pt-6 pb-4">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎭</span>
                <span className="text-sm font-bold text-mgm-accent">Montgomery Arts</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connecting people through the power of art, history, and shared cultural experiences in the heart of Montgomery.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-3">Quick Links</h4>
              <div className="space-y-1.5">
                {["Festival Calendar", "Museum Directory", "Art Fair Submissions", "Volunteer Opportunities"].map(l => (
                  <p key={l} className="text-[11px] text-slate-500 hover:text-white cursor-pointer transition">{l}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-3">Support</h4>
              <div className="space-y-1.5">
                {["Member Benefits", "Corporate Sponsorship", "Accessibility Services", "Privacy Policy"].map(l => (
                  <p key={l} className="text-[11px] text-slate-500 hover:text-white cursor-pointer transition">{l}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-3">Stay Updated</h4>
              <p className="text-[11px] text-slate-500 mb-2">Get the monthly cultural digest delivered to your inbox.</p>
              <div className="flex gap-1">
                <input placeholder="Email address" className="flex-1 bg-mgm-card-hover border border-mgm-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500" />
                <button className="w-8 h-8 bg-mgm-accent rounded-lg flex items-center justify-center text-white hover:bg-mgm-accent-dark transition">→</button>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-mgm-border text-center">
            <DataFooter />
          </div>
        </footer>
      </div>
    </div>
    </PageTransition>
  );
}
