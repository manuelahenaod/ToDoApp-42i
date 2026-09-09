import { useEffect, useState } from 'react';
import { getStats } from '../api/task';
import type { GlobalStats } from '../types/task';

export function useGlobalStats(refreshKey: number): GlobalStats | null {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return stats;
}