import type { TaskNode } from '../types/task';
import './ProgressBar.css';

function taskProgress(node: TaskNode): number {
  let total = 0;
  let done = 0;
  const walk = (n: TaskNode) => {
    total += 1;
    if (n.status === 'done') done += 1;
    n.subtasks.forEach(walk);
  };
  walk(node);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export default function ProgressBar({ node }: { node: TaskNode }) {
  const pct = taskProgress(node);
  return (
    <div className="progress">
      <div className="track">
        <div className={`fill${pct === 100 ? ' fill--done' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="pct">{pct}%</span>
    </div>
  );
}