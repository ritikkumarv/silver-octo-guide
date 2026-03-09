"use client";

import { useState } from "react";
import PageTransition from "@/components/UI/PageTransition";

interface SettingSection {
  title: string;
  icon: string;
  settings: Setting[];
}

interface Setting {
  label: string;
  description: string;
  type: "toggle" | "select";
  key: string;
  options?: string[];
}

const SECTIONS: SettingSection[] = [
  {
    title: "Notifications",
    icon: "🔔",
    settings: [
      { label: "Emergency Alerts", description: "Get notified about severe weather and public safety alerts", type: "toggle", key: "emergency_alerts" },
      { label: "Infrastructure Updates", description: "Road closures, water main breaks, power outages", type: "toggle", key: "infra_updates" },
      { label: "Community Events", description: "Upcoming events, meetings, and festivals", type: "toggle", key: "community_events" },
      { label: "Report Status Updates", description: "Updates on issues you've reported", type: "toggle", key: "report_updates" },
    ],
  },
  {
    title: "Dashboard Preferences",
    icon: "⚙️",
    settings: [
      { label: "Default Page", description: "Which page to show when opening the app", type: "select", key: "default_page", options: ["Overview", "Business", "Safety", "Infrastructure", "Culture"] },
      { label: "Data Refresh Interval", description: "How often to refresh live data", type: "select", key: "refresh_interval", options: ["30 seconds", "1 minute", "5 minutes", "Manual"] },
      { label: "Show Map on Overview", description: "Display the interactive map on the landing page", type: "toggle", key: "show_map" },
    ],
  },
  {
    title: "Accessibility",
    icon: "♿",
    settings: [
      { label: "High Contrast Mode", description: "Increase contrast for better readability", type: "toggle", key: "high_contrast" },
      { label: "Reduce Animations", description: "Minimize motion for reduced-motion preference", type: "toggle", key: "reduce_motion" },
      { label: "Text Size", description: "Adjust the base text size", type: "select", key: "text_size", options: ["Small", "Medium", "Large"] },
    ],
  },
];

const DEFAULTS: Record<string, boolean | string> = {
  emergency_alerts: true,
  infra_updates: true,
  community_events: false,
  report_updates: true,
  default_page: "Overview",
  refresh_interval: "5 minutes",
  show_map: true,
  high_contrast: false,
  reduce_motion: false,
  text_size: "Medium",
};

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, boolean | string>>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const select = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, persist to localStorage or backend
    try { localStorage.setItem("mgm_settings", JSON.stringify(values)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-mgm-bg">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-mgm-border">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚙️</span>
            <span className="text-base font-bold text-white">Settings</span>
          </div>
          <button
            onClick={handleSave}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              saved
                ? "bg-mgm-success text-white"
                : "bg-mgm-accent text-white hover:bg-mgm-accent-dark"
            }`}
          >
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </header>

        <div className="max-w-3xl mx-auto p-6 space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{section.icon}</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">{section.title}</h2>
              </div>

              <div className="bg-mgm-card border border-mgm-border rounded-xl divide-y divide-mgm-border">
                {section.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between px-4 py-3.5"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-semibold text-white">{setting.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
                    </div>

                    {setting.type === "toggle" ? (
                      <button
                        onClick={() => toggle(setting.key)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          values[setting.key] ? "bg-mgm-accent" : "bg-slate-600"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            values[setting.key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    ) : (
                      <select
                        value={values[setting.key] as string}
                        onChange={(e) => select(setting.key, e.target.value)}
                        className="bg-mgm-card-hover border border-mgm-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-mgm-accent"
                      >
                        {setting.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Account section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👤</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account</h2>
            </div>
            <div className="bg-mgm-card border border-mgm-border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-lg font-bold">
                  AR
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Alex Rivera</p>
                  <p className="text-xs text-slate-500">Administrator • Montgomery, AL</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
