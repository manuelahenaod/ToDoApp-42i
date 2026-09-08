import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ListResult, TaskNode, TaskPriority, TaskStatus } from '../types/task';
import { PriorityBadge } from './Badge';
import './TaskList.css';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
}

export type SortKey = 'title' | 'status' | 'priority' | 'effort' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  order: SortOrder;
}

interface TaskListProps {
  data: ListResult;
  filters: TaskFilters;
  sort: SortConfig;
  page: number;
  onFilterChange: (filters: TaskFilters) => void;
  onSortChange: (sort: SortConfig) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onAddSubtask: (parent: TaskNode) => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'effort', label: 'Effort' },
  { value: 'created_at', label: 'Created' },
];

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

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

function ProgressBar({ node }: { node: TaskNode }) {
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

function StatusSelect({ id, status, onChange }: { id: number; status: TaskStatus; onChange: (id: number, s: TaskStatus) => void }) {
  return (
    <select
      className="status-select"
      value={status}
      aria-label="Change status"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(id, e.target.value as TaskStatus)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}

export default function TaskList({ data, filters, sort, page, onFilterChange, onSortChange, onPageChange, onStatusChange, onAddSubtask }: TaskListProps) {
  const [expanded, setExpanded] = useState<Map<number, boolean>>(new Map());

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(id, !prev.get(id));
      return next;
    });

  const isExpanded = (id: number) => expanded.get(id) ?? false;
  const resetPage = () => onPageChange(1);

  const changeFilter = (patch: TaskFilters) => {
    onFilterChange({ ...filters, ...patch });
    resetPage();
  };

  const changeSort = (key: SortKey) => {
    if (sort.key === key) {
      onSortChange({ key, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ key, order: key === 'created_at' ? 'desc' : 'asc' });
    }
  };

  const flipOrder = () => onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' });

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          <select value={filters.status ?? ''} onChange={(e) => changeFilter({ status: (e.target.value || undefined) as TaskStatus | undefined })} aria-label="Filter by status">
            <option value="">Status: All</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <select value={filters.priority ?? ''} onChange={(e) => changeFilter({ priority: (e.target.value || undefined) as TaskPriority | undefined })} aria-label="Filter by priority">
            <option value="">Priority: All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="sort">
          <select value={sort.key} onChange={(e) => changeSort(e.target.value as SortKey)} aria-label="Sort by">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="button" className="sort-order" onClick={flipOrder} title={sort.order === 'asc' ? 'Ascending' : 'Descending'}>
            {sort.order === 'asc' ? 'A→Z' : 'Z→A'}
          </button>
        </div>
      </div>

      {data.tasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found.</p>
          <p className="empty-hint">Create a task with the “+ New task” button.</p>
        </div>
      ) : (
        <>
          {/* Mobile / tablet: cards */}
          <div className="card-list">
            {data.tasks.map((task) => (
              <div key={task.id} className={`task-card${isExpanded(task.id) ? ' open' : ''}`}>
                <div className="card-head" onClick={task.subtasks.length ? () => toggle(task.id) : undefined}>
                  {task.subtasks.length ? (
                    isExpanded(task.id) ? <ChevronDown size={14} className="caret" /> : <ChevronRight size={14} className="caret" />
                  ) : (
                    <span className="caret-placeholder" />
                  )}
                  <span className="card-title">
                    {task.title}
                    <span className="id">#{task.id}</span>
                  </span>
                  <Link className="card-link" to={`/tasks/${task.id}`} onClick={(e) => e.stopPropagation()}>
                    Details
                  </Link>
                  <button
                    type="button"
                    className="add-subtask"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask(task);
                    }}
                    aria-label="Add subtask"
                  >
                    +
                  </button>
                </div>
                <div className="card-meta">
                  <StatusSelect id={task.id} status={task.status} onChange={onStatusChange} />
                  <PriorityBadge priority={task.priority} />
                  <span className="card-effort">{task.total_effort ?? task.effort_estimate ?? 0}</span>
                </div>
                <ProgressBar node={task} />
                {isExpanded(task.id) && task.subtasks.length > 0 && (
                  <div className="card-subtasks">
                    {task.subtasks.map((sub) => (
                      <SubCard key={sub.id} node={sub} depth={1} isExpanded={isExpanded} toggle={toggle} onStatusChange={onStatusChange} onAddSubtask={onAddSubtask} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="table-wrap">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="col-effort">Effort</th>
                  <th className="col-progress">Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((task) => (
                  <TaskRow key={task.id} node={task} depth={0} isExpanded={isExpanded} toggle={toggle} onStatusChange={onStatusChange} onAddSubtask={onAddSubtask} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
            <span className="page-info">{data.total} tasks · Page {page} of {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => onPageChange(page + 1)}>→</button>
          </div>
        </>
      )}
    </div>
  );
}

function SubCard({ node, depth, isExpanded, toggle, onStatusChange, onAddSubtask }: { node: TaskNode; depth: number; isExpanded: (id: number) => boolean; toggle: (id: number) => void; onStatusChange: (id: number, s: TaskStatus) => void; onAddSubtask: (parent: TaskNode) => void }) {
  const hasChildren = node.subtasks.length > 0;
  const expanded = isExpanded(node.id);
  return (
    <div className="card-subtask" style={{ marginLeft: depth * 12 }}>
      <div className={`card-subtitle${hasChildren ? ' clickable' : ''}`} onClick={hasChildren ? () => toggle(node.id) : undefined}>
        {hasChildren ? (
          expanded ? <ChevronDown size={13} className="caret" /> : <ChevronRight size={13} className="caret" />
        ) : (
          <span className="caret-placeholder caret-placeholder--sm" />
        )}
        <span className="card-subtitle-text">
          {node.title}
          <span className="id"> #{node.id}</span>
        </span>
      </div>
      <div className="card-meta">
        <StatusSelect id={node.id} status={node.status} onChange={onStatusChange} />
        <PriorityBadge priority={node.priority} />
        <span className="card-effort">{node.total_effort ?? node.effort_estimate ?? 0}</span>
        <button type="button" className="add-subtask add-subtask--tiny" onClick={() => onAddSubtask(node)} aria-label="Add subtask">
          +
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="card-subtasks">
          {node.subtasks.map((sub) => (
            <SubCard key={sub.id} node={sub} depth={depth + 1} isExpanded={isExpanded} toggle={toggle} onStatusChange={onStatusChange} onAddSubtask={onAddSubtask} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ node, depth, isExpanded, toggle, onStatusChange, onAddSubtask }: { node: TaskNode; depth: number; isExpanded: (id: number) => boolean; toggle: (id: number) => void; onStatusChange: (id: number, s: TaskStatus) => void; onAddSubtask: (parent: TaskNode) => void }) {
  const hasChildren = node.subtasks.length > 0;
  const expanded = isExpanded(node.id);

  return (
    <>
      <tr className={hasChildren ? 'row-parent' : ''} onClick={hasChildren ? () => toggle(node.id) : undefined}>
        <td style={{ paddingLeft: `${16 + depth * 22}px` }}>
          <span className="row-icon">
            {hasChildren && expanded ? <ChevronDown size={14} /> : hasChildren ? <ChevronRight size={14} /> : <span className="caret-placeholder" />}
          </span>
          {node.title}
          <span className="id"> #{node.id}</span>
        </td>
        <td><StatusSelect id={node.id} status={node.status} onChange={onStatusChange} /></td>
        <td><PriorityBadge priority={node.priority} /></td>
        <td className="col-effort">{node.total_effort ?? node.effort_estimate ?? 0}</td>
        <td className="col-progress"><ProgressBar node={node} /></td>
        <td>
          <Link className="link" to={`/tasks/${node.id}`} onClick={(e) => e.stopPropagation()}>Details</Link>
          <button type="button" className="add-subtask add-subtask--table" onClick={(e) => { e.stopPropagation(); onAddSubtask(node); }} aria-label="Add subtask">
            +
          </button>
        </td>
      </tr>
      {hasChildren && expanded && node.subtasks.map((sub) => (
        <TaskRow key={sub.id} node={sub} depth={depth + 1} isExpanded={isExpanded} toggle={toggle} onStatusChange={onStatusChange} onAddSubtask={onAddSubtask} />
      ))}
    </>
  );
}