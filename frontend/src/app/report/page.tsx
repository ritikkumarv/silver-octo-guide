"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/UI/PageTransition";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const categories = [
  { icon: "🕳️", label: "Pothole / Road Damage" },
  { icon: "💡", label: "Street Light Outage" },
  { icon: "🚰", label: "Water / Sewer Issue" },
  { icon: "🗑️", label: "Missed Trash Pickup" },
  { icon: "🌳", label: "Fallen Tree / Debris" },
  { icon: "🔊", label: "Noise Complaint" },
  { icon: "🚧", label: "Unsafe Sidewalk" },
  { icon: "🚦", label: "Traffic Signal Issue" },
];

export default function ReportPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setLocation(data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocation("Unable to get location — please enter manually");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !location) return;
    setSubmitting(true);

    // Generate tracking ID
    const trackingId = `MGM-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Try to submit to backend chat as a context
    try {
      await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Issue report: ${category} at ${location}. ${description}` }),
      });
    } catch {}

    // Navigate to success page
    setTimeout(() => {
      router.push(`/report/success?id=${trackingId}&cat=${encodeURIComponent(category)}&loc=${encodeURIComponent(location)}`);
    }, 800);
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-mgm-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-mgm-border">
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <span className="text-base font-bold text-white">Report an Issue</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Step 1 of 2</span>
          <div className="flex gap-1">
            <div className="w-8 h-1.5 rounded-full bg-mgm-accent" />
            <div className="w-8 h-1.5 rounded-full bg-mgm-border" />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Help Us Improve Montgomery</h1>
          <p className="text-sm text-slate-400">Report infrastructure issues, safety concerns, or service problems. Your reports help keep our city running smoothly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Issue Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map(c => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCategory(c.label)}
                  className={`p-3 rounded-xl text-center transition ${
                    category === c.label
                      ? "bg-mgm-accent/20 border-2 border-mgm-accent"
                      : "bg-mgm-card border border-mgm-border hover:border-mgm-accent/50"
                  }`}
                >
                  <span className="text-xl block mb-1">{c.icon}</span>
                  <p className="text-[10px] font-medium text-white">{c.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Location</label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter address or intersection (e.g., 300 S Perry St)"
                className="w-full bg-mgm-card border border-mgm-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-mgm-accent"
                required
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mgm-accent text-xs font-semibold hover:text-mgm-accent-dark transition disabled:opacity-50"
              >
                {locating ? "⏳ Locating..." : "📍 Use Current"}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. Include any relevant information like size, severity, or how long the issue has been present."
              rows={4}
              className="w-full bg-mgm-card border border-mgm-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-mgm-accent resize-none"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">{description.length}/500 characters</p>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Urgency Level</label>
            <div className="flex gap-3">
              {[
                { value: "low", label: "Low", desc: "Non-urgent, cosmetic", color: "bg-mgm-success" },
                { value: "medium", label: "Medium", desc: "Moderate impact", color: "bg-mgm-warning" },
                { value: "high", label: "High", desc: "Safety hazard", color: "bg-mgm-danger" },
              ].map(u => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={`flex-1 p-3 rounded-xl text-center transition ${
                    urgency === u.value
                      ? "bg-mgm-card border-2 border-mgm-accent"
                      : "bg-mgm-card border border-mgm-border hover:border-mgm-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${u.color}`} />
                    <span className="text-sm font-bold text-white">{u.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{u.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Attach Photo (Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-mgm-border rounded-xl p-8 text-center hover:border-mgm-accent/50 transition cursor-pointer"
            >
              {photoName ? (
                <>
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="text-sm text-mgm-accent font-semibold">{photoName}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <span className="text-3xl block mb-2">📷</span>
                  <p className="text-sm text-slate-400">Click to upload a photo</p>
                  <p className="text-[10px] text-slate-500 mt-1">JPG, PNG up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!category || !description || !location || submitting}
              className="flex-1 py-3.5 bg-mgm-accent text-white rounded-xl text-sm font-bold hover:bg-mgm-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-3.5 bg-mgm-card border border-mgm-border text-white rounded-xl text-sm font-medium hover:bg-mgm-card-hover transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    </PageTransition>
  );
}
