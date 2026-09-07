import type { GlobalStats } from '../types/task';
import './StatsBar.css';

export default function StatsBar({ stats }: { stats: GlobalStats | null }) {
  const todo = stats?.todo ?? 0;
  const progress = stats?.in_progress ?? 0;
  const done = stats?.done ?? 0;
  const total = stats?.total ?? 0;

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <section className="stats">
      <div className="stats-row">
        <div className="stat stat--todo">
          <div className="stat-value">{todo}</div>
          <span className="stat-label">To do</span>
        </div>
        <div className="stat stat--progress">
          <div className="stat-value">{progress}</div>
          <span className="stat-label">In progress</span>
        </div>
        <div className="stat stat--done">
          <div className="stat-value">{done}</div>
          <span className="stat-label">Done</span>
        </div>
      </div>

      <div className="bar-stacked">
        <div className="seg seg--todo" style={{ width: `${pct(todo)}%` }} />
        <div className="seg seg--progress" style={{ width: `${pct(progress)}%` }} />
        <div className="seg seg--done" style={{ width: `${pct(done)}%` }} />
      </div>
    </section>
  );
}