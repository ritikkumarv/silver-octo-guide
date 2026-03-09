export interface MapPoint {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryDisplay: string;
  color: string;
  lat: number;
  lon: number;
  location: string;
  contact?: string;
  hours?: string;
  status?: string;
}

export interface CategorySummary {
  key: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  map_highlights?: MapHighlight[];
  timestamp: Date;
}

export interface MapHighlight {
  name: string;
  lat: number;
  lon: number;
  category: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  map_highlights: MapHighlight[];
}

export interface DashboardStats {
  total_data_points: number;
  categories: number;
  parks: number;
  hospitals: number;
  historical_sites: number;
  bus_routes: number;
  weather: WeatherData;
  population: number;
  city: string;
}
