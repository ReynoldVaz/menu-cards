import React, { createContext, useContext, useState, useCallback } from 'react';

export type AnalyticsSummary = Record<string, number>;
export type AnalyticsSummaryCache = Record<string, AnalyticsSummary>;

interface AnalyticsSummaryContextType {
  cache: AnalyticsSummaryCache;
  setSummary: (restaurantId: string, summary: AnalyticsSummary) => void;
}

const AnalyticsSummaryContext = createContext<AnalyticsSummaryContextType | undefined>(undefined);

export const AnalyticsSummaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<AnalyticsSummaryCache>({});

  const setSummary = useCallback((restaurantId: string, summary: AnalyticsSummary) => {
    setCache((prev) => ({ ...prev, [restaurantId]: summary }));
  }, []);

  return (
    <AnalyticsSummaryContext.Provider value={{ cache, setSummary }}>
      {children}
    </AnalyticsSummaryContext.Provider>
  );
};

export function useAnalyticsSummary() {
  const ctx = useContext(AnalyticsSummaryContext);
  if (!ctx) throw new Error('useAnalyticsSummary must be used within AnalyticsSummaryProvider');
  return ctx;
}
