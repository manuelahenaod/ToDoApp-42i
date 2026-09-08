import { PRIORITY_LABELS, STATUS_LABELS } from '../types/labels';
import type { TaskPriority, TaskStatus } from '../types/task';
import './Badge.css';

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`badge badge--prio-${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`prio-tag prio-tag--${priority}`}>
      <span className="prio-dot" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}