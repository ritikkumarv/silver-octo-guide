"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Static data for known Montgomery venues
const venueDetails: Record<string, any> = {
  "rosa-parks-museum": {
    name: "Rosa Parks Museum",
    type: "Museum",
    tagColor: "bg-mgm-accent",
    addr: "252 Montgomery St, Montgomery, AL 36104",
    hours: "Mon–Sat 9AM–5PM",
    price: "$7.50 Adults / $5.50 Children",
    phone: "(334) 241-8615",
    dataset: "recreation_culture",
    about: "The Rosa Parks Museum, located at the site where Rosa Parks was arrested, tells the story of the Montgomery Bus Boycott and the Civil Rights Movement. The museum features interactive exhibits, a restored 1955 bus, and a children's wing.",
  },
  "fine-arts-museum": {
    name: "Montgomery Museum of Fine Arts",
    type: "Museum",
    tagColor: "bg-mgm-accent",
    addr: "One Museum Drive, Montgomery, AL 36117",
    hours: "Tue–Sat 10AM–5PM, Sun 12–5PM",
    price: "Free Admission",
    phone: "(334) 625-4333",
    dataset: "recreation_culture",
    about: "MMFA features an outstanding collection of American art, including works from the 19th and 20th centuries, European art, and a significant collection of Southern regional art. Located in the beautiful Blount Cultural Park.",
  },
  "shakespeare-festival": {
    name: "Alabama Shakespeare Festival",
    type: "Theater",
    tagColor: "bg-purple-500",
    addr: "1 Festival Dr, Montgomery, AL 36117",
    hours: "Varies by showtime",
    price: "$25–$60 per show",
    phone: "(334) 271-5353",
    dataset: "recreation_culture",
    about: "One of the largest Shakespeare festivals in the world, ASF produces more than 20 productions each year in two performance spaces. The festival also hosts educational programs and the Southern Writers' Project. Located in the Wynton M. Blount Cultural Park.",
  },
  "montgomery-zoo": {
    name: "Montgomery Zoo & Mann Museum",
    type: "Zoo",
    tagColor: "bg-mgm-success",
    addr: "2301 Coliseum Pkwy, Montgomery, AL 36110",
    hours: "Daily 9AM–5PM",
    price: "$15 Adults / $12 Children",
    phone: "(334) 625-4900",
    dataset: "recreation_culture",
    about: "Home to over 500 animals from five continents, the Montgomery Zoo spans 40 acres and features the Mann Wildlife Learning Museum. Attractions include the Overlook Café, gift shop, and numerous educational programs throughout the year.",
  },
};

const defaultVenue = {
  name: "Montgomery Venue",
  type: "Attraction",
  tagColor: "bg-mgm-accent",
  addr: "Montgomery, AL",
  hours: "Varies",
  price: "Contact for pricing",
  phone: "(334) 000-0000",
  about: "A popular Montgomery destination offering unique experiences and community engagement opportunities.",
};

export default function VenueDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const venue = venueDetails[id] || defaultVenue;
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    if (venue.dataset) {
      fetch(`${API}/datasets/${venue.dataset}`)
        .then(r => r.json())
        .then(d => {
          const match = (d.data || []).find((item: any) =>
            item.name?.toLowerCase().includes(venue.name.split(" ")[0].toLowerCase())
          );
          if (match) setApiData(match);
        })
        .catch(() => {});
    }
  }, [venue]);

  const upcomingEvents = [
    { title: "Guided Tour: Civil Rights History", date: "Mar 8", time: "10:00 AM", spots: 12 },
    { title: "Evening Lecture Series", date: "Mar 14", time: "7:00 PM", spots: 45 },
    { title: "Family Workshop", date: "Mar 22", time: "2:00 PM", spots: 8 },
  ];

  const reviews = [
    { name: "Sarah M.", rating: 5, text: "An incredible experience. The interactive exhibits really bring history to life.", date: "2 weeks ago" },
    { name: "James R.", rating: 4, text: "Well-organized and informative. Great for families with children.", date: "1 month ago" },
    { name: "Linda K.", rating: 5, text: "A must-visit when in Montgomery. Allow at least 2 hours to see everything.", date: "2 months ago" },
  ];

  return (
    <div className="min-h-screen bg-mgm-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-mgm-border">
        <div className="flex items-center gap-3">
          <Link href="/culture" className="text-slate-400 hover:text-white transition text-sm">← Back</Link>
          <div className="w-px h-4 bg-mgm-border" />
          <span className="text-base font-bold text-white">{venue.name}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-white ${venue.tagColor}`}>{venue.type?.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-mgm-card border border-mgm-border rounded-lg text-xs text-white hover:border-mgm-accent transition">📤 Share</button>
          <button className="px-3 py-2 bg-mgm-card border border-mgm-border rounded-lg text-xs text-white hover:border-mgm-accent transition">❤️ Save</button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[260px] bg-gradient-to-r from-mgm-card-hover via-mgm-card to-mgm-card-hover">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl opacity-10">🏛️</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-mgm-bg to-transparent h-32" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">{venue.name}</h1>
            <p className="text-sm text-slate-400 mt-1">📍 {venue.addr}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className="text-sm">{s <= 4 ? "⭐" : "☆"}</span>
              ))}
            </div>
            <span className="text-sm text-white font-bold">4.6</span>
            <span className="text-xs text-slate-500">({apiData?.annual_visitors ? (apiData.annual_visitors / 1000).toFixed(0) + "K" : "500+"} reviews)</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8 space-y-6">
            {/* About */}
            <div className="mgm-card p-6">
              <h2 className="text-base font-bold text-white mb-3">About</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{venue.about}</p>
              {apiData?.description && (
                <p className="text-sm text-slate-400 leading-relaxed mt-3">{apiData.description}</p>
              )}
              {apiData?.annual_visitors && (
                <div className="mt-4 p-3 rounded-xl bg-mgm-card-hover flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="text-sm font-bold text-white">{apiData.annual_visitors.toLocaleString()} annual visitors</p>
                    <p className="text-[10px] text-slate-500">Based on most recent data</p>
                  </div>
                </div>
              )}
            </div>

            {/* Events */}
            <div className="mgm-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Upcoming Events</h2>
                <button className="text-xs text-mgm-accent font-semibold">View All Events</button>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-mgm-card-hover hover:bg-mgm-border transition cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="text-center w-12">
                        <p className="text-[10px] text-mgm-accent font-bold">{e.date.split(" ")[0]}</p>
                        <p className="text-lg font-black text-white">{e.date.split(" ")[1]}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{e.title}</p>
                        <p className="text-[11px] text-slate-500">{e.time} · {e.spots} spots remaining</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-mgm-accent/20 text-mgm-accent rounded-lg text-xs font-semibold hover:bg-mgm-accent hover:text-white transition">
                      RSVP
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div className="mgm-card p-6">
              <h2 className="text-base font-bold text-white mb-4">Gallery</h2>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-mgm-card-hover to-mgm-card rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition">
                    <span className="text-3xl opacity-15">📸</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mgm-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Visitor Reviews</h2>
                <button className="px-4 py-2 bg-mgm-card-hover border border-mgm-border rounded-lg text-xs text-white hover:border-mgm-accent transition">
                  Write a Review
                </button>
              </div>
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl bg-mgm-card-hover">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-mgm-accent/20 flex items-center justify-center text-xs font-bold text-mgm-accent">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{r.name}</p>
                          <p className="text-[10px] text-slate-500">{r.date}</p>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className="text-xs">{s <= r.rating ? "⭐" : "☆"}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Visitor Info */}
          <div className="col-span-4 space-y-5">
            {/* Visitor Information */}
            <div className="mgm-card p-5 sticky top-6">
              <h3 className="text-sm font-bold text-white mb-4">Visitor Information</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-base flex-shrink-0">🕐</span>
                  <div>
                    <p className="text-xs text-slate-500">Hours</p>
                    <p className="text-sm font-medium text-white">{venue.hours}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-base flex-shrink-0">🎫</span>
                  <div>
                    <p className="text-xs text-slate-500">Admission</p>
                    <p className="text-sm font-medium text-white">{venue.price}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-base flex-shrink-0">📞</span>
                  <div>
                    <p className="text-xs text-slate-500">Contact</p>
                    <p className="text-sm font-medium text-white">{venue.phone}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-base flex-shrink-0">📍</span>
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm font-medium text-white">{venue.addr}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-mgm-border space-y-3">
                <button className="w-full py-3 bg-mgm-accent text-white rounded-xl text-sm font-bold hover:bg-mgm-accent-dark transition">
                  🎫 Book Tickets
                </button>
                <button className="w-full py-3 bg-mgm-card-hover border border-mgm-border text-white rounded-xl text-sm font-medium hover:bg-mgm-border transition">
                  📍 Get Directions
                </button>
              </div>

              {/* Accessibility */}
              <div className="mt-5 pt-4 border-t border-mgm-border">
                <h4 className="text-xs font-bold text-white mb-2">Accessibility</h4>
                <div className="flex flex-wrap gap-2">
                  {["♿ Wheelchair", "🅿️ Parking", "🔊 Audio Guide", "👶 Family"].map(a => (
                    <span key={a} className="text-[10px] px-2 py-1 bg-mgm-card-hover rounded-lg text-slate-400">{a}</span>
                  ))}
                </div>
              </div>

              {/* Nearby */}
              <div className="mt-5 pt-4 border-t border-mgm-border">
                <h4 className="text-xs font-bold text-white mb-3">Nearby Venues</h4>
                <div className="space-y-2">
                  {Object.entries(venueDetails)
                    .filter(([key]) => key !== id)
                    .slice(0, 3)
                    .map(([key, v]) => (
                      <Link
                        key={key}
                        href={`/venue/${key}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-mgm-card-hover transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-mgm-card-hover flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">🏛️</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{v.name}</p>
                          <p className="text-[9px] text-slate-500">{v.type}</p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
