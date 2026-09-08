import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateTaskInput, TaskPriority, TaskStatus } from '../types/task';
import './TaskForm.css';

interface TaskFormProps {
  title: string;
  submitLabel: string;
  defaultStatus?: TaskStatus;
  defaultPriority?: TaskPriority;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultEffort?: string;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onClose: () => void;
}

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export default function TaskForm({
  title,
  submitLabel,
  defaultStatus = 'todo',
  defaultPriority = 'medium',
  defaultTitle = '',
  defaultDescription = '',
  defaultEffort = '',
  onSubmit,
  onClose,
}: TaskFormProps) {
  const [form, setForm] = useState({
    title: defaultTitle,
    description: defaultDescription,
    status: defaultStatus,
    priority: defaultPriority,
    effort: defaultEffort,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const titleValue = form.title.trim();
    if (!titleValue) {
      setError('Title is required.');
      return;
    }

    const input: CreateTaskInput = {
      title: titleValue,
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
    };
    if (form.effort.trim() !== '') input.effort_estimate = Number(form.effort);

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
    <div className="modal-scrim" onClick={onClose}>
      <form className="task-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="task-form-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label className="field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Build login"
            autoFocus
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional details…"
            rows={3}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Effort estimate </span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.effort}
            onChange={(e) => set('effort', e.target.value)}
            placeholder="Optional"
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="task-form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}