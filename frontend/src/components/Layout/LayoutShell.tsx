"use client";

import { useState, ReactNode } from "react";
import dynamic from "next/dynamic";
import Sidebar, { SidebarContext } from "./Sidebar";

const ChatPanel = dynamic(() => import("@/components/Chat/ChatPanel"), { ssr: false });

export default function LayoutShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const toggle = () => setIsOpen((o) => !o);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      <Sidebar />
      <main className="lg:ml-[180px] min-h-screen transition-all duration-300">
        {children}
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-mgm-accent text-white shadow-lg shadow-mgm-accent/30 hover:bg-mgm-accent-dark transition-all flex items-center justify-center group"
        aria-label="Open AI Chat"
      >
        {chatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {!chatOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-mgm-success rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
            AI
          </span>
        )}
      </button>

      {/* Floating Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[380px] h-[520px] animate-fade-in">
          <ChatPanel />
        </div>
      )}
    </SidebarContext.Provider>
  );
}
