"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import dynamic from "next/dynamic";
import DataFooter from "@/components/UI/DataFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/* ═══════════════════════════════════════════════════════
   DYNAMIC MAP (no SSR)
   ═══════════════════════════════════════════════════════ */
function LiveMapInner() {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((l) => setL(l.default));
    }
  }, []);

  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [32.3792, -86.3077],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);
    mapRef.current = map;

    fetch(`${API}/map/points`)
      .then((r) => r.json())
      .then((points: any[]) => {
        points.forEach((p) => {
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:8px;height:8px;background:${p.color};border:2px solid white;border-radius:50%;box-shadow:0 0 6px ${p.color};"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          L.marker([p.lat, p.lon], { icon }).addTo(map);
        });
      })
      .catch(() => {});

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [L]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: 400 }}
    />
  );
}

const LiveMap = dynamic(() => Promise.resolve(LiveMapInner), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-2xl bg-mgm-card flex items-center justify-center"
      style={{ minHeight: 400 }}
    >
      <div className="w-10 h-10 border-4 border-mgm-accent/30 border-t-mgm-accent rounded-full animate-spin" />
    </div>
  ),
});

/* ═══════════════════════════════════════════════════════
   CHAT DEMO (auto-typing showcase)
   ═══════════════════════════════════════════════════════ */
const CHAT_MESSAGES = [
  {
    role: "user",
    text: "What events are happening this weekend?",
  },
  {
    role: "assistant",
    text: "This weekend in Montgomery: 🎵 Alabama Jazz Festival at the Riverwalk, 🎨 First Friday Art Walk downtown, and 📚 Book Fair at the Montgomery City-County Public Library. Would you like details?",
  },
  {
    role: "user",
    text: "How do I apply for a business license?",
  },
  {
    role: "assistant",
    text: "Visit the Revenue Department at City Hall (103 N Perry St) or apply online. You'll need: valid ID, business plan, and $50 fee. Processing takes 5-7 business days.",
  },
];

function ChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || visibleCount >= CHAT_MESSAGES.length) return;
    const timer = setTimeout(
      () => setVisibleCount((c) => c + 1),
      visibleCount === 0 ? 600 : 1400
    );
    return () => clearTimeout(timer);
  }, [inView, visibleCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  return (
    <div ref={containerRef} className="glass-card overflow-hidden">
      <div className="px-5 py-3.5 bg-gradient-to-r from-mgm-accent to-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">CivicAccess AI</p>
            <p className="text-[11px] text-blue-100">Powered by GPT-4o + RAG</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto no-scrollbar">
        {CHAT_MESSAGES.slice(0, visibleCount).map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-mgm-accent text-white rounded-br-none"
                  : "bg-mgm-card text-slate-300 rounded-bl-none border border-mgm-border"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
        {visibleCount > 0 && visibleCount < CHAT_MESSAGES.length && (
          <div className="flex gap-1.5 px-3 py-2 bg-mgm-card rounded-xl w-fit border border-mgm-border">
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <div className="flex-1 bg-mgm-bg border border-mgm-border rounded-lg px-3 py-2.5 text-xs text-slate-500">
            Ask about Montgomery...
          </div>
          <div className="w-9 h-9 bg-mgm-accent rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════ */
function CounterStat({
  value,
  suffix,
  label,
  index,
}: {
  value: number;
  suffix: string;
  label: string;
  index: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <motion.div ref={ref} variants={fadeUp} custom={index} className="text-center">
      <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-sm text-slate-400 mt-2 font-medium">{label}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

/* ═══════════════════════════════════════════════════════
   FEATURE DATA
   ═══════════════════════════════════════════════════════ */
const FEATURES = [
  {
    title: "Business Intelligence",
    description:
      "Track new licenses, economic growth, and business trends across Montgomery in real-time.",
    href: "/business",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    title: "Infrastructure Monitor",
    description:
      "Monitor roads, utilities, water systems, and public facilities with live data feeds.",
    href: "/infrastructure",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    title: "Public Safety",
    description:
      "Real-time crime mapping, community watch updates, and emergency response tracking.",
    href: "/safety",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    gradient: "from-red-500 to-orange-400",
  },
  {
    title: "Cultural Events",
    description:
      "Discover museums, galleries, festivals, and community events happening across the city.",
    href: "/culture",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.21-1-.55-1.36-.34-.36-.55-.83-.55-1.36 0-1.1.9-2 2-2h2.36c3.08 0 5.64-2.56 5.64-5.64C23 5.82 18.14 2 12 2z" />
        <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
        <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="15.5" cy="7.5" r="1.5" fill="currentColor" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-400",
  },
  {
    title: "Civic Dashboard",
    description:
      "Comprehensive city analytics with sentiment analysis, trends, and demographic insights.",
    href: "/civic",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-400",
  },
  {
    title: "AI City Assistant",
    description:
      "Ask questions about permits, events, schedules, and services — powered by GPT-4o + RAG.",
    href: "/civic",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: "from-amber-500 to-yellow-400",
  },
];

const TECH_STACK = [
  "Next.js 14",
  "FastAPI",
  "GPT-4o Mini",
  "LangChain",
  "ChromaDB",
  "ArcGIS Portal",
  "Bright Data",
  "Leaflet",
  "Framer Motion",
];

/* ═══════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [portalStats, setPortalStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/portal/stats`)
      .then((r) => r.json())
      .then(setPortalStats)
      .catch(() => {});
  }, []);

  const totalRecords = portalStats?.total_records || 2835;
  const totalCategories = portalStats?.categories || 8;

  return (
    <div className="min-h-screen bg-mgm-bg">
      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden">
        {/* Background effects */}
        <div className="hero-grid absolute inset-0" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-mgm-accent/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[140px] animate-float-delayed" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-[100px] animate-float" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mgm-accent/30 bg-mgm-accent/5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-mgm-success animate-pulse" />
            <span className="text-sm text-mgm-accent-light font-medium">
              AI-Powered Smart City Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6"
          >
            Smarter City.
            <br />
            <span className="text-gradient">Better Living.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Real-time insights, AI-powered analytics, and live data from{" "}
            <span className="text-white font-semibold">Montgomery, Alabama</span>{" "}
            — all in one intelligent dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/civic">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 bg-gradient-to-r from-mgm-accent to-blue-500 text-white rounded-xl text-base font-semibold shadow-lg shadow-mgm-accent/25 hover:shadow-mgm-accent/40 transition-shadow"
              >
                Explore Dashboard
              </motion.button>
            </Link>
            <Link href="/civic">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 bg-mgm-card border border-mgm-border text-white rounded-xl text-base font-semibold hover:border-mgm-accent/50 transition-colors"
              >
                Talk to CivicAI&nbsp;&nbsp;→
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-mgm-success" />
              27 Live Data Feeds
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-mgm-accent" />
              RAG-Powered AI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Real-Time Analytics
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Open City Data
            </span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-mgm-accent"
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="py-20 px-4 sm:px-6 border-t border-mgm-border/50">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          {[
            { label: "Population Served", value: 200603, suffix: "+" },
            { label: "Live Data Records", value: totalRecords, suffix: "+" },
            { label: "Data Categories", value: totalCategories, suffix: "" },
            { label: "AI Accuracy", value: 97, suffix: "%" },
          ].map((stat, i) => (
            <CounterStat key={stat.label} {...stat} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span className="text-sm font-semibold text-mgm-accent uppercase tracking-wider">
              Modules
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-4">
              What You Can Explore
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Six powerful modules powered by live city data and artificial
              intelligence to help you understand Montgomery better.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Link href={f.href}>
                  <motion.div
                    whileHover={{
                      y: -6,
                      borderColor: "rgba(59,130,246,0.3)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="feature-card-glow mgm-card p-6 h-full cursor-pointer group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-4 group-hover:shadow-lg transition-shadow`}
                    >
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-mgm-accent-light transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {f.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-mgm-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 5l7 7-7 7"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ MAP SECTION ═══════ */}
      <section className="py-20 px-4 sm:px-6 border-t border-mgm-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideFromLeft}
            >
              <span className="text-sm font-semibold text-mgm-accent uppercase tracking-wider">
                Live Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-5">
                Real-Time City Map
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-6">
                Visualize every data point across Montgomery — from business
                locations and infrastructure assets to safety incidents and
                cultural venues — all plotted on an interactive live map.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { color: "bg-blue-400", label: "Business & Economic Activity" },
                  { color: "bg-emerald-400", label: "Infrastructure & Utilities" },
                  { color: "bg-red-400", label: "Public Safety Incidents" },
                  { color: "bg-purple-400", label: "Cultural Venues & Events" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/civic">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-3 bg-mgm-card border border-mgm-border text-white rounded-xl text-sm font-semibold hover:border-mgm-accent/50 transition-colors"
                >
                  Open Full Map →
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={slideFromRight}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-mgm-accent/20 to-purple-500/20 rounded-2xl blur-xl" />
              <div className="relative h-[400px] rounded-2xl overflow-hidden border border-mgm-border">
                <LiveMap />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ AI SECTION ═══════ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideFromLeft}
              className="order-2 lg:order-1"
            >
              <ChatDemo />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideFromRight}
              className="order-1 lg:order-2"
            >
              <span className="text-sm font-semibold text-mgm-accent uppercase tracking-wider">
                AI Assistant
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-5">
                Ask Anything About Your City
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-6">
                CivicAccess AI uses Retrieval-Augmented Generation (RAG) with
                GPT-4o to provide accurate, context-aware answers about
                Montgomery&apos;s services, events, and policies.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: "🔍",
                    title: "Smart Retrieval",
                    desc: "Searches through 8 local datasets + 27 live portal feeds",
                  },
                  {
                    icon: "🧠",
                    title: "Context-Aware",
                    desc: "Understands nuanced questions about city services and policies",
                  },
                  {
                    icon: "⚡",
                    title: "Real-Time Data",
                    desc: "Powered by live ArcGIS portal data updated continuously",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ TECH STACK ═══════ */}
      <section className="py-16 px-4 sm:px-6 border-t border-mgm-border/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="max-w-4xl mx-auto text-center"
        >
          <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-6">
            Built With Modern Technology
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH_STACK.map((tech) => (
              <motion.span
                key={tech}
                whileHover={{
                  scale: 1.05,
                  borderColor: "rgba(59,130,246,0.5)",
                }}
                className="px-4 py-2 rounded-lg bg-mgm-card border border-mgm-border text-sm text-slate-300 font-medium transition-colors cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-20 px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="max-w-3xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-mgm-accent/20 via-transparent to-purple-500/20" />
            <div className="relative glass-card p-10 sm:p-14 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to Explore Montgomery Smarter?
              </h2>
              <p className="text-slate-400 mb-8 text-lg max-w-lg mx-auto">
                Dive into live data, AI insights, and interactive maps — all
                built for the citizens of Montgomery.
              </p>
              <Link href="/civic">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 bg-gradient-to-r from-mgm-accent to-blue-500 text-white rounded-xl text-lg font-bold shadow-lg shadow-mgm-accent/25 hover:shadow-mgm-accent/40 transition-shadow"
                >
                  Get Started — It&apos;s Free
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <div className="px-4 sm:px-6 pb-6">
        <DataFooter />
      </div>
    </div>
  );
}