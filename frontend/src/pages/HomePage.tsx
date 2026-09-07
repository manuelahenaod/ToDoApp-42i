import { useEffect, useState } from 'react';
import { getStats } from '../api/task';
import StatsBar from '../components/StatsBar';
import type { GlobalStats } from '../types/task';

export default function HomePage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div>
      <StatsBar stats={stats} />
      <p>Lista de tareas — llega en unos pasos.</p>
    </div>
  );
}