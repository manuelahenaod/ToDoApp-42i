import type { TaskPriority, TaskStatus } from '../types/task';
import './Badge.css';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

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