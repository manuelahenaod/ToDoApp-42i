import { Zap } from 'lucide-react';
import type { EffortStats } from '../types/task';
import './EffortBreakdown.css';

export default function EffortBreakdown({ effort }: { effort: EffortStats }) {
  return (
    <div className="detail-effort">
      <div className="effort-block">
        <span className="effort-label">Total effort</span>
        <span className="effort-value"><Zap size={14} /> {effort.total}</span>
      </div>
      <div className="effort-block effort-block--todo">
        <span className="effort-label">Effort to do</span>
        <span className="effort-value"><Zap size={14} /> {effort.todo}</span>
      </div>
      <div className="effort-block effort-block--prog">
        <span className="effort-label">Effort in progress</span>
        <span className="effort-value"><Zap size={14} /> {effort.in_progress}</span>
      </div>
      <div className="effort-block effort-block--done">
        <span className="effort-label">Effort completed</span>
        <span className="effort-value"><Zap size={14} /> {effort.done}</span>
      </div>
    </div>
  );
}