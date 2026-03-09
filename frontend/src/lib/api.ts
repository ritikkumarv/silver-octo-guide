const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Health
  health: () => fetchAPI<{ status: string }>("/health"),

  // Dashboard
  getStats: () => fetchAPI<any>("/stats"),
  getCategories: () => fetchAPI<any[]>("/categories"),

  // Datasets
  getAllDatasets: () => fetchAPI<Record<string, any[]>>("/datasets"),
  getDataset: (category: string) => fetchAPI<any>(`/datasets/${category}`),

  // Map
  getMapPoints: () => fetchAPI<any[]>("/map/points"),
  getMapPointsByCategory: (category: string) => fetchAPI<any[]>(`/map/points/${category}`),

  // Weather
  getWeather: () => fetchAPI<any>("/weather"),
  getWeatherForecast: () => fetchAPI<any>("/weather/forecast"),

  // Chat
  sendMessage: (message: string) =>
    fetchAPI<any>("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  resetChat: () =>
    fetchAPI<any>("/chat/reset", { method: "POST" }),

  // News (Bright Data)
  getNews: () => fetchAPI<any>("/news"),
  getAlerts: () => fetchAPI<any>("/alerts"),

  // Sentiment
  getSentiment: () => fetchAPI<any>("/sentiment"),
  analyzeSentiment: (text: string) =>
    fetchAPI<any>("/sentiment/analyze", {
      method: "POST",
      body: JSON.stringify({ message: text }),
    }),

  // Service Finder
  findServices: (query: string) =>
    fetchAPI<any>("/services/find", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
  getServiceCategories: () => fetchAPI<any>("/services/categories"),

  // Page-specific aggregations
  getBusinessOverview: () => fetchAPI<any>("/business/overview"),
  getInfrastructureStatus: () => fetchAPI<any>("/infrastructure/status"),
  getSafetyOverview: () => fetchAPI<any>("/safety/overview"),
  getCultureOverview: () => fetchAPI<any>("/culture/overview"),
};
