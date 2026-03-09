"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const trackingId = params.get("id") || "MGM-0000-XXXX";
  const category = params.get("cat") || "Infrastructure Issue";
  const location = params.get("loc") || "Montgomery, AL";

  const steps = [
    { num: 1, title: "Report Received", desc: "Your report has been logged in our system and assigned a tracking ID.", status: "done" },
    { num: 2, title: "Under Review", desc: "A city coordinator will review and categorize the issue within 24 hours.", status: "active" },
    { num: 3, title: "Team Assigned", desc: "The appropriate department or crew will be dispatched.", status: "pending" },
    { num: 4, title: "Resolved", desc: "The issue is fixed and you'll receive a confirmation notification.", status: "pending" },
  ];

  return (
    <div className="min-h-screen bg-mgm-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-mgm-border">
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <span className="text-base font-bold text-white">Report Submitted</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Step 2 of 2</span>
          <div className="flex gap-1">
            <div className="w-8 h-1.5 rounded-full bg-mgm-accent" />
            <div className="w-8 h-1.5 rounded-full bg-mgm-accent" />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Success Animation */}
        <div className="text-center mb-8 pt-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-mgm-success/20 flex items-center justify-center mb-4 animate-[fadeIn_0.5s_ease-out]">
            <svg className="w-10 h-10 text-mgm-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Report Successfully Submitted!</h1>
          <p className="text-sm text-slate-400">Thank you for helping improve Montgomery. Here are your report details.</p>
        </div>

        {/* Report Summary Card */}
        <div className="mgm-card p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tracking ID</p>
              <p className="text-xl font-black text-mgm-accent mt-0.5 font-mono">{trackingId}</p>
            </div>
            <span className="badge badge-success text-[10px]">SUBMITTED</span>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-mgm-card-hover">
            <div>
              <p className="text-[10px] text-slate-500">Category</p>
              <p className="text-sm font-medium text-white mt-0.5">{category}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Location</p>
              <p className="text-sm font-medium text-white mt-0.5">{location}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Estimated Resolution</p>
              <p className="text-sm font-medium text-mgm-accent mt-0.5">3-5 Business Days</p>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mgm-card p-6 mb-6">
          <h2 className="text-base font-bold text-white mb-5">What Happens Next</h2>
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={s.num} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    s.status === "done"
                      ? "bg-mgm-success text-white"
                      : s.status === "active"
                      ? "bg-mgm-accent text-white"
                      : "bg-mgm-card-hover text-slate-500 border border-mgm-border"
                  }`}>
                    {s.status === "done" ? "✓" : s.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 h-12 ${
                      s.status === "done" ? "bg-mgm-success" : "bg-mgm-border"
                    }`} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6">
                  <p className={`text-sm font-bold ${
                    s.status === "pending" ? "text-slate-500" : "text-white"
                  }`}>{s.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="mgm-card p-4 text-center hover:border-mgm-accent/50 transition cursor-pointer">
            <span className="text-lg block mb-1">📧</span>
            <p className="text-xs font-bold text-white">Email Confirmation</p>
            <p className="text-[9px] text-slate-500">Get a copy by email</p>
          </button>
          <button className="mgm-card p-4 text-center hover:border-mgm-accent/50 transition cursor-pointer">
            <span className="text-lg block mb-1">🔔</span>
            <p className="text-xs font-bold text-white">Enable Notifications</p>
            <p className="text-[9px] text-slate-500">Get status updates</p>
          </button>
          <button className="mgm-card p-4 text-center hover:border-mgm-accent/50 transition cursor-pointer">
            <span className="text-lg block mb-1">📱</span>
            <p className="text-xs font-bold text-white">Share Report</p>
            <p className="text-[9px] text-slate-500">Copy tracking link</p>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-3">
          <Link
            href="/report"
            className="flex-1 py-3.5 bg-mgm-accent text-white rounded-xl text-sm font-bold text-center hover:bg-mgm-accent-dark transition"
          >
            Submit Another Report
          </Link>
          <Link
            href="/"
            className="flex-1 py-3.5 bg-mgm-card border border-mgm-border text-white rounded-xl text-sm font-medium text-center hover:bg-mgm-card-hover transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReportSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mgm-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-mgm-accent border-t-transparent rounded-full animate-spin"/></div>}>
      <SuccessContent />
    </Suspense>
  );
}
