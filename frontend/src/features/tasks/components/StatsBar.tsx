import type { GlobalStats } from '../types/task';
import { ListTodo, Clock, CheckCircle2, PieChart } from 'lucide-react';
import './StatsBar.css';

export default function StatsBar({ stats }: { stats: GlobalStats | null }) {
  const todo = stats?.todo ?? 0;
  const progress = stats?.in_progress ?? 0;
  const done = stats?.done ?? 0;
  const total = stats?.total ?? 0;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const donePct = pct(done);

  return (
    <section className="stats-container">
      <div className="stats-grid">
        <div className="stat-card stat--total">
          <div className="stat-icon-wrapper">
            <PieChart size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Tasks</span>
            <div className="stat-value">{total}</div>
          </div>
        </div>

        <div className="stat-card stat--todo">
          <div className="stat-icon-wrapper">
            <ListTodo size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">To do</span>
            <div className="stat-value">{todo}</div>
          </div>
        </div>

        <div className="stat-card stat--progress">
          <div className="stat-icon-wrapper">
            <Clock size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">In progress</span>
            <div className="stat-value">{progress}</div>
          </div>
        </div>

        <div className="stat-card stat--done">
          <div className="stat-icon-wrapper">
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed ({donePct}%)</span>
            <div className="stat-value">{done}</div>
          </div>
        </div>
      </div>

      <div className="bar-stacked-wrapper">
        <div className="bar-stacked">
          <div className="seg seg--todo" style={{ width: `${(todo / (total || 1)) * 100}%` }} title={`To do: ${todo}`} />
          <div className="seg seg--progress" style={{ width: `${(progress / (total || 1)) * 100}%` }} title={`In progress: ${progress}`} />
          <div className="seg seg--done" style={{ width: `${(done / (total || 1)) * 100}%` }} title={`Completed: ${done}`} />
        </div>
      </div>
    </section>
  );
}