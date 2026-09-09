import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { STATUS_LABELS } from '../types/labels';
import type { TaskStatus } from '../types/task';
import './Badge.css';
import './TaskStatusSelector.css';

interface TaskStatusSelectorProps {
  status: TaskStatus;
  hasSubtasks: boolean;
  subtaskCount: number;
  onChange: (status: TaskStatus) => void;
}

export default function TaskStatusSelector({ status, hasSubtasks, subtaskCount, onChange }: TaskStatusSelectorProps) {
  if (hasSubtasks) {
    return <DerivedStatusBadge status={status} subtaskCount={subtaskCount} />;
  }
  return (
    <label className={`status-pill status-pill--${status}`}>
      <select
        className={`badge badge--${status} status-select`}
        value={status}
        aria-label="Change status"
        onChange={(e) => onChange(e.target.value as TaskStatus)}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="status-caret" />
    </label>
  );
}

function DerivedStatusBadge({ status, subtaskCount }: { status: TaskStatus; subtaskCount: number }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <span className="status-pop" ref={wrapRef}>
      <button
        type="button"
        className={`badge badge--${status} status-derived`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {STATUS_LABELS[status]}
        <span className="status-derived-dot" />
      </button>
      {open && (
        <div className="status-popover" role="tooltip">
          <div className="status-popover-head">
            <span className="status-popover-title">
              <Info size={13} />
              Derived status
            </span>
            <button type="button" className="status-popover-close" aria-label="Dismiss" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <p className="status-popover-body">
            This status is calculated from its <strong>{subtaskCount}</strong>{' '}
            subtask{subtaskCount === 1 ? '' : 's'}. Complete the subtasks or change their status to update it.
          </p>
        </div>
      )}
    </span>
  );
}