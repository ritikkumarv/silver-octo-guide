"use client";

import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface MapHighlight {
  name: string;
  lat: number;
  lon: number;
  category: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  map_highlights?: MapHighlight[];
  timestamp: Date;
}

interface ChatPanelProps {
  onHighlights?: (highlights: MapHighlight[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  city_services: "City Services",
  general_information: "General Info",
  planning_development: "Planning & Dev",
  public_health: "Public Health",
  public_safety: "Public Safety",
  recreation_culture: "Recreation & Culture",
  transportation: "Transportation",
  historical_markers: "Historical Markers",
};

const SUGGESTIONS = [
  "What's the safest neighborhood in Montgomery?",
  "Tell me about Civil Rights historical sites",
  "Where can I find public health clinics?",
  "What parks and recreation is available?",
  "How's the public transit system?",
  "What development projects are underway?",
];

export default function ChatPanel({ onHighlights }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hello! I'm **MontgomeryAI**, your smart assistant for the City of Montgomery, Alabama.\n\nI can help you with information about:\n🏛️ City Services • ℹ️ General Info • 📈 Development\n❤️ Public Health • 🛡️ Public Safety • 🌲 Recreation\n🚗 Transportation • 📍 Historical Sites\n\nAsk me anything about Montgomery!",
      sources: [],
      map_highlights: [],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) throw new Error("Chat API error");

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        map_highlights: data.map_highlights || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Send highlights to map
      if (data.map_highlights?.length > 0) {
        onHighlights?.(data.map_highlights);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I couldn't process that request. Please make sure the backend server is running on port 8000 with a valid OpenAI API key configured.",
        sources: [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = async () => {
    try {
      await fetch(`${API}/chat/reset`, { method: "POST" });
    } catch {}
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "🔄 Chat reset! Ask me anything about Montgomery.",
        sources: [],
        timestamp: new Date(),
      },
    ]);
    onHighlights?.([]);
  };

  return (
    <div className="flex flex-col h-full bg-mgm-card border border-mgm-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mgm-border bg-mgm-sidebar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-mgm-accent/20 border border-mgm-accent flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Ask Montgomery
            </h3>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              AI-Powered
            </p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="text-xs px-2 py-1 rounded bg-mgm-card-hover text-slate-400 hover:text-white transition"
        >
          Reset
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-mgm-accent text-white rounded-br-md"
                  : "bg-mgm-card-hover border border-mgm-border rounded-bl-md"
              }`}
            >
              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" ? "text-white" : "text-gray-200"
                }`}
              >
                {msg.content}
              </p>

              {/* Source tags */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.sources.map((src) => (
                    <span
                      key={src}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-mgm-accent/20 text-mgm-accent"
                    >
                      {CATEGORY_LABELS[src] || src}
                    </span>
                  ))}
                </div>
              )}

              {/* Map highlight indicator */}
              {msg.map_highlights && msg.map_highlights.length > 0 && (
                <p className="mt-1.5 text-[10px] text-mgm-accent/70 flex items-center gap-1">
                  📍 {msg.map_highlights.length} location(s) shown on map
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-mgm-card-hover border border-mgm-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="typing-dot w-2 h-2 rounded-full bg-mgm-accent" />
                <div className="typing-dot w-2 h-2 rounded-full bg-mgm-accent" />
                <div className="typing-dot w-2 h-2 rounded-full bg-mgm-accent" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-mgm-border text-slate-400 hover:text-mgm-accent hover:border-mgm-accent/50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-mgm-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Montgomery..."
            disabled={isLoading}
            className="flex-1 bg-mgm-card-hover border border-mgm-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-mgm-accent/50 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-mgm-accent rounded-xl text-white font-semibold text-sm hover:bg-mgm-accent-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
