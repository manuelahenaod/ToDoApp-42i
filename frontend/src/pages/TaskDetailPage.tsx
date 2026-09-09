import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Zap } from 'lucide-react';
import { useTask } from '../features/tasks/hooks/useTask';
import { useTaskMutations } from '../features/tasks/hooks/useTaskMutations';
import { PriorityBadge } from '../features/tasks/components/Badge';
import ProgressBar from '../features/tasks/components/ProgressBar';
import TaskForm from '../features/tasks/components/TaskForm';
import TaskBreadcrumbs from '../features/tasks/components/TaskBreadcrumbs';
import EffortBreakdown from '../features/tasks/components/EffortBreakdown';
import SubtreeList from '../features/tasks/components/SubtreeList';
import TaskStatusSelector from '../features/tasks/components/TaskStatusSelector';
import ConfirmModal from '../shared/ui/ConfirmModal';
import type { TaskStatus } from '../features/tasks/types/task';
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const taskId = Number(id);
  const invalidId = !Number.isInteger(taskId) || taskId <= 0;

  const { task, error, reload } = useTask(invalidId ? -1 : taskId);
  const { pending: deleting, remove, update, createSubtask } = useTaskMutations();

  const visibleError = error ?? actionError;

  if (invalidId) {
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
      await update(taskId, { status });
      setActionError(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unexpected error.');
    }
  }

  async function handleDelete() {
    try {
      await remove(taskId);
      navigate('/');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unexpected error.');
    }
  }

  if (visibleError) {
    return (
      <div className="detail-fallback">
        <p>{visibleError}</p>
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

      <TaskBreadcrumbs parents={task.parents} current={task.title} />

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
            <TaskStatusSelector status={task.status} hasSubtasks={hasSubtasks} subtaskCount={task.subtasks.length} onChange={handleStatusChange} />
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

        {task.description && <p className="detail-desc">{task.description}</p>}

        <ProgressBar node={task} />

        <EffortBreakdown effort={task.effort} />
      </section>

      <SubtreeList node={task} onAddSubtask={() => setSubtaskOpen(true)} />

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
            await update(taskId, input);
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

