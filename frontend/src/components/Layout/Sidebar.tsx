"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";

// Context for sidebar state
export const SidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
}>({ isOpen: true, toggle: () => {} });

const NAV_ITEMS = [
  {
    section: "MAIN MENU",
    items: [
      { label: "Overview", href: "/", icon: "grid" },
      { label: "Business", href: "/business", icon: "briefcase" },
      { label: "Infrastructure", href: "/infrastructure", icon: "wrench" },
      { label: "Public Safety", href: "/safety", icon: "shield" },
      { label: "Culture", href: "/culture", icon: "palette" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { label: "Dashboard", href: "/civic", icon: "user", badge: undefined as number | undefined },
      { label: "Alerts", href: "/alerts", icon: "bell", badge: 3 },
      { label: "Reports", href: "/report", icon: "file-text" },
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];

const ICONS: Record<string, JSX.Element> = {
  grid: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8"/>
    </svg>
  ),
  briefcase: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.8"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.8"/>
    </svg>
  ),
  wrench: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeWidth="1.8"/>
    </svg>
  ),
  shield: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.8"/>
    </svg>
  ),
  heart: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeWidth="1.8"/>
    </svg>
  ),
  palette: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.21-1-.55-1.36-.34-.36-.55-.83-.55-1.36 0-1.1.9-2 2-2h2.36c3.08 0 5.64-2.56 5.64-5.64C23 5.82 18.14 2 12 2z" strokeWidth="1.8"/>
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor"/>
      <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor"/>
      <circle cx="15.5" cy="7.5" r="1.5" fill="currentColor"/>
    </svg>
  ),
  user: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="1.8"/>
      <circle cx="12" cy="7" r="4" strokeWidth="1.8"/>
    </svg>
  ),
  bell: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.8"/>
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth="1.8"/>
    </svg>
  ),
  "file-text": (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="1.8"/>
      <polyline points="14 2 14 8 20 8" strokeWidth="1.8"/>
      <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.8"/>
      <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.8"/>
    </svg>
  ),
  settings: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth="1.8"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="1.8"/>
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useContext(SidebarContext);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggle}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={toggle}
        className="fixed top-3 left-3 z-50 lg:hidden w-10 h-10 rounded-lg bg-mgm-card border border-mgm-border flex items-center justify-center text-white"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <aside className={`fixed left-0 top-0 h-screen w-[180px] bg-mgm-sidebar border-r border-mgm-border flex flex-col z-50 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-mgm-accent flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Montgomery</p>
            <p className="text-[10px] text-slate-500 tracking-wider">CIVIC DASHBOARD</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="mb-4">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-mgm-accent text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-slate-500"}>
                      {ICONS[item.icon]}
                    </span>
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-[10px] bg-mgm-danger text-white w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-mgm-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
            AR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Alex Rivera</p>
            <p className="text-[10px] text-slate-500">Administrator</p>
          </div>
        </div>
        <button className="w-full mt-1 py-1.5 rounded-lg bg-mgm-accent/10 text-mgm-accent text-xs font-medium hover:bg-mgm-accent/20 transition">
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}
