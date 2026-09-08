import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { createSubtask, deleteTask, getTask, updateTask } from '../api/task';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import { STATUS_LABELS } from '../types/labels';
import ProgressBar from '../components/ProgressBar';
import TaskForm from '../components/TaskForm';
import ConfirmModal from '../components/ConfirmModal';
import type { TaskDetail, TaskNode, TaskStatus } from '../types/task';
import './TaskDetailPage.css';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const taskId = Number(id);

  const reload = useCallback(() => {
    getTask(taskId)
      .then((t) => {
        setTask(t);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unexpected error.'));
  }, [taskId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return (
      <div className="detail-fallback">
        <p>Invalid task id.</p>
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back to board
        </Link>
      </div>
    );
  }

  async function handleStatusChange(status: TaskStatus) {
    try {
      await updateTask(taskId, { status });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTask(taskId);
      navigate('/');
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    }
  }

  if (error) {
    return (
      <div className="detail-fallback">
        <p>{error}</p>
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back to board
        </Link>
      </div>
    );
  }

  if (!task || task.id !== taskId) {
    return <div className="detail-fallback">Loading…</div>;
  }

  const hasSubtasks = task.subtasks.length > 0;

  return (
    <div className="detail-page animate-fade-in">
      {task.parent_id === null && (
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back to board
        </Link>
      )}

      {task.parents.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {task.parents.map((parent) => (
            <span className="crumb" key={parent.id}>
              <Link to={`/tasks/${parent.id}`}>{parent.title}</Link>
              <ChevronRight size={12} className="crumb-sep" />
            </span>
          ))}
          <span className="crumb crumb--current">{task.title}</span>
        </nav>
      )}

      <section className="detail-card">
        <div className="detail-head">
          <div className="detail-info">
            <h2 className="detail-title">{task.title}</h2>
            <div className="detail-meta">
              Created {formatDate(task.created_at)}
              {task.effort_estimate !== null && task.effort_estimate !== undefined ? (
                <>
                  {' '}
                  · Effort estimate: <Zap size={12} /> {task.effort_estimate}
                </>
              ) : (
                ' · No own effort'
              )}
            </div>
          </div>

          <div className="detail-badges">
            <StateBadge status={task.status} hasSubtasks={hasSubtasks} onChange={handleStatusChange} />
            <PriorityBadge priority={task.priority} />
          </div>

          <div className="detail-actions">
            <button type="button" className="action-btn action-btn--edit" onClick={() => setEditOpen(true)}>
              <Pencil size={14} /> Edit
            </button>
            <button type="button" className="action-btn action-btn--delete" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {hasSubtasks && (
          <p className="detail-hint">
            Status is derived from subtasks — this task has {task.subtasks.length} subtask{task.subtasks.length === 1 ? '' : 's'}.
          </p>
        )}

        {task.description && <p className="detail-desc">{task.description}</p>}

        <ProgressBar node={task} />

        <div className="detail-effort">
          <div className="effort-block">
            <span className="effort-label">Total effort</span>
            <span className="effort-value"><Zap size={14} /> {task.effort.total}</span>
          </div>
          <div className="effort-block effort-block--todo">
            <span className="effort-label">Effort to do</span>
            <span className="effort-value"><Zap size={14} /> {task.effort.todo}</span>
          </div>
          <div className="effort-block effort-block--prog">
            <span className="effort-label">Effort in progress</span>
            <span className="effort-value"><Zap size={14} /> {task.effort.in_progress}</span>
          </div>
          <div className="effort-block effort-block--done">
            <span className="effort-label">Effort completed</span>
            <span className="effort-value"><Zap size={14} /> {task.effort.done}</span>
          </div>
        </div>
      </section>

      <section className="detail-card">
        <div className="subtree-head">
          <h3>
            Subtasks <span className="subtree-count">({task.subtasks.length})</span>
          </h3>
          <button type="button" className="add-btn" onClick={() => setSubtaskOpen(true)}>
            <Plus size={15} /> Add subtask
          </button>
        </div>

        {task.subtasks.length === 0 ? (
          <p className="subtree-empty">No subtasks yet.</p>
        ) : (
          <div className="subtree">
            <SubtreeNode node={task} />
          </div>
        )}
      </section>

      {editOpen && (
        <TaskForm
          title="Edit task"
          submitLabel="Save task"
          defaultTitle={task.title}
          defaultDescription={task.description}
          defaultPriority={task.priority}
          defaultEffort={task.effort_estimate !== null && task.effort_estimate !== undefined ? String(task.effort_estimate) : ''}
          effortLocked={hasSubtasks}
          onSubmit={async (input) => {
            await updateTask(taskId, input);
            setEditOpen(false);
            reload();
          }}
          onClose={() => setEditOpen(false)}
        />
      )}

      {subtaskOpen && (
        <TaskForm
          title={`Add subtask to “${task.title}”`}
          submitLabel="Create subtask"
          onSubmit={async (input) => {
            await createSubtask(taskId, input);
            setSubtaskOpen(false);
            reload();
          }}
          onClose={() => setSubtaskOpen(false)}
        />
      )}

      {confirmOpen && (
        <ConfirmModal
          title="Delete task?"
          message={`“${task.title}” and its ${task.subtasks.length} subtask${task.subtasks.length === 1 ? '' : 's'} will be deleted permanently.`}
          confirmLabel="Delete"
          busy={deleting}
          busyLabel="Deleting…"
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

interface StateBadgeProps {
  status: TaskStatus;
  hasSubtasks: boolean;
  onChange: (status: TaskStatus) => void;
}

function StateBadge({ status, hasSubtasks, onChange }: StateBadgeProps) {
  if (hasSubtasks) {
    return <StatusBadge status={status} />;
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

function SubtreeNode({ node, depth = 0 }: { node: TaskNode; depth?: number }) {
  const children = Array.isArray(node.subtasks) ? node.subtasks : [];
  if (depth > 2) return null;
  return (
    <div className="subtree-group">
      {children.map((child) => (
        <div key={child.id}>
          <Link className={`task-row task-row--depth-${depth}`} to={`/tasks/${child.id}`}>
            <span className={`status-dot status-dot--${child.status}`} />
            <span className={`row-title${child.status === 'done' ? ' row-title--done' : ''}`}>{child.title}</span>
            {depth === 2 && child.subtasks.length > 0 && (
              <span className="task-dots" aria-label="Open subtasks" title="Open subtasks">⋯</span>
            )}
            <span className="row-effort"><Zap size={11} /> {child.total_effort ?? 0}</span>
            <ChevronRight size={15} className="row-chevron" />
          </Link>
          <SubtreeNode node={child} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}