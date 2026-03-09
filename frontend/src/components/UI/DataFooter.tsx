"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function DataFooter() {
  const [status, setStatus] = useState<"connected" | "checking" | "disconnected">("checking");
  const [lastRefresh, setLastRefresh] = useState<string>("");

  useEffect(() => {
    const checkConnection = () => {
      setStatus("checking");
      fetch(`${API}/health`)
        .then((r) => {
          if (r.ok) {
            setStatus("connected");
            setLastRefresh(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
          } else {
            setStatus("disconnected");
          }
        })
        .catch(() => setStatus("disconnected"));
    };
    checkConnection();
    const id = setInterval(checkConnection, 120000); // check every 2 min
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-t border-mgm-border px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className={`w-1.5 h-1.5 rounded-full ${
                status === "connected" ? "bg-emerald-400" :
                status === "checking" ? "bg-yellow-400" : "bg-red-400"
              }`} />
              {status === "connected" && (
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className={`text-[10px] font-semibold ${
              status === "connected" ? "text-emerald-400" :
              status === "checking" ? "text-yellow-400" : "text-red-400"
            }`}>
              {status === "connected" ? "LIVE" : status === "checking" ? "CONNECTING..." : "OFFLINE"}
            </span>
          </div>

          {/* Data sources */}
          <div className="flex items-center gap-3">
            {[
              { name: "Montgomery Open Data Portal", icon: "🏛️" },
              { name: "OpenAI GPT-4o", icon: "🤖" },
              { name: "Bright Data", icon: "🔍" },
              { name: "OpenWeather", icon: "🌤️" },
            ].map((src) => (
              <div key={src.name} className="flex items-center gap-1">
                <span className="text-[10px]">{src.icon}</span>
                <span className="text-[9px] text-slate-500">{src.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[9px] text-slate-600">
              Last sync: {lastRefresh}
            </span>
          )}
          <p className="text-[10px] text-slate-600">
            &copy; 2026 MontgomeryAI &middot; GenAI.works Academy &middot; Alabama State University
          </p>
        </div>
      </div>
    </div>
  );
}
