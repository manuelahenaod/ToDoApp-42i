import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CreateTaskInput, TaskPriority } from '../types/task';
import { PRIORITY_LABELS } from '../types/labels';
import './TaskForm.css';

interface TaskFormProps {
  title: string;
  submitLabel: string;
  defaultPriority?: TaskPriority;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultEffort?: string;
  effortLocked?: boolean;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onClose: () => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export default function TaskForm({
  title,
  submitLabel,
  defaultPriority = 'medium',
  defaultTitle = '',
  defaultDescription = '',
  defaultEffort = '',
  effortLocked = false,
  onSubmit,
  onClose,
}: TaskFormProps) {
  const [form, setForm] = useState({
    title: defaultTitle,
    description: defaultDescription,
    priority: defaultPriority,
    effort: defaultEffort,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const effortRaw = form.effort.trim();
  const effortError =
    effortRaw === ''
      ? null
      : (() => {
          const n = Number(effortRaw);
          if (!Number.isInteger(n)) return 'Effort must be a whole number.';
          if (n < 0) return 'Effort cannot be negative.';
          return null;
        })();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const titleValue = form.title.trim();
    if (!titleValue) {
      setError('Title is required.');
      return;
    }
    if (effortError) return;

    const input: CreateTaskInput = {
      title: titleValue,
      description: form.description.trim() || undefined,
      priority: form.priority,
    };
    if (!effortLocked && form.effort.trim() !== '') input.effort_estimate = Number(form.effort);

    setSaving(true);
    setError(null);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-scrim animate-fade-in" onClick={onClose}>
      <form className="task-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="task-form-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label className="field">
          <span>Title *</span>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Build login API endpoint"
            autoFocus
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Add relevant task details or context…"
            rows={3}
          />
        </label>

        <div className="field">
          <span className="field-title">Priority</span>
          <div className="priority-selector" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => {
              const isSelected = form.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`prio-btn prio-btn--${p} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => set('priority', p)}
                >
                  <span className="prio-btn-dot" />
                  <span>{PRIORITY_LABELS[p]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className={`field${effortLocked ? ' field--locked' : ''}${effortError ? ' field--error' : ''}`}>
          <span>Effort estimate</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.effort}
            onChange={(e) => set('effort', e.target.value)}
            placeholder="e.g. 5"
            disabled={effortLocked}
            aria-invalid={effortError ? true : undefined}
          />
          {effortLocked ? (
            <span className="field-hint">Effort is derived from its subtasks — edit a subtask to change it.</span>
          ) : effortError ? (
            <span className="field-error">{effortError}</span>
          ) : null}
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="task-form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}