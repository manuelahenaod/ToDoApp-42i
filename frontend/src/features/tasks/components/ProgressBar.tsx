import { taskProgress } from '../utils/taskProgress';
import type { TaskNode } from '../types/task';
import './ProgressBar.css';

export default function ProgressBar({ node }: { node: TaskNode }) {
  const pct = taskProgress(node);
  const isDone = pct === 100;
  return (
    <div className="progress">
      <div className="track">
        <div className={`fill${isDone ? ' fill--done' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`pct${isDone ? ' pct--done' : ''}`}>{pct}%</span>
    </div>
  );
}