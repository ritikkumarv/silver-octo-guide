import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useApi<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

export function useMapPoints() {
  return useApi(() => api.getMapPoints());
}

export function useCategories() {
  return useApi(() => api.getCategories());
}

export function useStats() {
  return useApi(() => api.getStats());
}

export function useWeather() {
  return useApi(() => api.getWeather());
}
