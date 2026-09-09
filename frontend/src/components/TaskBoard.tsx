import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Layers,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import { listTasks } from '../api/task';
import type {
  ListResult,
  SortOrder,
  TaskNode,
  TaskPriority,
  TaskSortKey,
  TaskStatus,
} from '../types/task';
import { PRIORITY_LABELS } from '../types/labels';
import { PriorityTag } from './Badge';
import ProgressBar from './ProgressBar';
import './TaskBoard.css';

const COLUMNS: { id: TaskStatus; label: string; icon: typeof CircleDot }[] = [
  { id: 'todo', label: 'To do', icon: CircleDot },
  { id: 'in_progress', label: 'In progress', icon: Clock },
  { id: 'done', label: 'Done', icon: CheckCircle2 },
];

const INITIAL_LIMIT = 4;
const STEP = 5;

const PRIORITY_FILTERS: (TaskPriority | undefined)[] = [
  undefined,
  'critical',
  'high',
  'medium',
  'low',
];

interface SortOption {
  key: string;
  label: string;
  sort: TaskSortKey;
  order: SortOrder;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'newest', label: 'Newest', sort: 'created_at', order: 'desc' },
  { key: 'oldest', label: 'Oldest', sort: 'created_at', order: 'asc' },
  { key: 'title', label: 'Title A → Z', sort: 'title', order: 'asc' },
  { key: 'priority', label: 'Priority', sort: 'priority', order: 'asc' },
  { key: 'effort', label: 'Effort', sort: 'effort', order: 'desc' },
];

type ColumnState = { tasks: TaskNode[]; total: number };

interface TaskBoardProps {
  refreshKey: number;
  onAddSubtask: (parent: TaskNode) => void;
}

export default function TaskBoard({ refreshKey, onAddSubtask }: TaskBoardProps) {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<Record<TaskStatus, ColumnState>>({
    todo: { tasks: [], total: 0 },
    in_progress: { tasks: [], total: 0 },
    done: { tasks: [], total: 0 },
  });
  const [limits, setLimits] = useState<Record<TaskStatus, number>>({
    todo: INITIAL_LIMIT,
    in_progress: INITIAL_LIMIT,
    done: INITIAL_LIMIT,
  });
  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [sortKey, setSortKey] = useState<TaskSortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const resetLimits = () =>
    setLimits({ todo: INITIAL_LIMIT, in_progress: INITIAL_LIMIT, done: INITIAL_LIMIT });

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      COLUMNS.map(({ id }) =>
        listTasks({ status: id, priority, limit: limits[id], sort: sortKey, order: sortOrder })
          .then((res: ListResult) => ({ status: id, tasks: res.tasks, total: res.total }))
          .catch(() => ({ status: id, tasks: [] as TaskNode[], total: 0 }))
      )
    ).then((results) => {
      if (cancelled) return;
      setColumns((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.status] = { tasks: r.tasks, total: r.total };
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, limits, priority, sortKey, sortOrder]);

  const loadMore = (status: TaskStatus) =>
    setLimits((l) => ({ ...l, [status]: l[status] + STEP }));

  const changePriority = (value: TaskPriority | undefined) => {
    setPriority(value);
    resetLimits();
  };

  const changeSort = (option: SortOption) => {
    setSortKey(option.sort);
    setSortOrder(option.order);
    resetLimits();
  };

  const hasFilters = priority !== undefined || sortKey !== 'created_at' || sortOrder !== 'desc';

  const resetFilters = () => {
    setPriority(undefined);
    setSortKey('created_at');
    setSortOrder('desc');
    resetLimits();
  };

  return (
    <>
      <div className="board-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Priority</span>
          <div className="pill-group" role="group" aria-label="Filter by priority">
            {PRIORITY_FILTERS.map((p) => {
              const active = priority === p;
              return (
                <button
                  key={p ?? 'all'}
                  type="button"
                  className={`pill${active ? ' is-active' : ''}${p ? ` pill--${p}` : ''}`}
                  aria-pressed={active}
                  onClick={() => changePriority(p)}
                >
                  {p && <span className={`pill-dot pill-dot--${p}`} />}
                  {p ? PRIORITY_LABELS[p] : 'All'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Sort</span>
          <div className="pill-group" role="group" aria-label="Sort tasks">
            {SORT_OPTIONS.map((opt) => {
              const active = sortKey === opt.sort && sortOrder === opt.order;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`pill${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => changeSort(opt)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {hasFilters && (
          <button type="button" className="clear-filters" onClick={resetFilters}>
            <X size={12} />
            Reset
          </button>
        )}
      </div>

      <div className="board">
        {COLUMNS.map(({ id, label, icon: StatusIcon }) => {
          const column = columns[id];
          const shown = limits[id];
          const hasMore = column.total > shown;
          const isExpanded = shown > INITIAL_LIMIT;
          return (
            <section key={id} className={`column column--${id}`}>
              <header className="column-head">
                <div className="column-head-left">
                  <span className={`status-icon icon--${id}`}>
                    <StatusIcon size={14} />
                  </span>
                  <h2 className="column-title">{label}</h2>
                </div>
                <span className={`column-count count--${id}`}>{column.total}</span>
              </header>

              <div className="column-list">
                {column.total === 0 && <p className="column-empty">No tasks yet.</p>}
                {column.tasks.map((task) => (
                  <BoardCard
                    key={task.id}
                    node={task}
                    onOpen={() => navigate(`/tasks/${task.id}`)}
                    onAddSubtask={onAddSubtask}
                  />
                ))}
                {(hasMore || isExpanded) && (
                  <div className="column-actions">
                    {hasMore && (
                      <button type="button" className="load-more" onClick={() => loadMore(id)}>
                        <Plus size={14} />
                        <span>Load more</span>
                      </button>
                    )}
                    {isExpanded && (
                      <button type="button" className="show-less" onClick={() => setLimits((l) => ({ ...l, [id]: INITIAL_LIMIT }))}>
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function BoardCard({
  node,
  onOpen,
  onAddSubtask,
}: {
  node: TaskNode;
  onOpen: () => void;
  onAddSubtask: (parent: TaskNode) => void;
}) {
  const isDone = node.status === 'done';
  const effort = node.total_effort ?? node.effort_estimate ?? 0;

  return (
    <article className={`card card--prio-${node.priority}${isDone ? ' card--done' : ''}`} onClick={onOpen}>
      <div className="card-top">
        <h3 className="card-title">{node.title}</h3>
        <PriorityTag priority={node.priority} />
      </div>

      {node.description && <p className="card-desc">{node.description}</p>}

      <ProgressBar node={node} />

      <footer className="card-foot">
        <div className="card-subtasks-wrapper">
          {node.subtasks.length > 0 ? (
            <Link className="card-subtasks" to={`/tasks/${node.id}`} onClick={(e) => e.stopPropagation()}>
              <Layers size={13} />
              <span>{node.subtasks.length} subtask{node.subtasks.length > 1 ? 's' : ''}</span>
              <ChevronRight size={12} />
            </Link>
          ) : (
            <span className="card-subtasks card-subtasks--none">
              <Layers size={13} />
              <span>0 subtasks</span>
            </span>
          )}
          <button
            type="button"
            className="icon-btn"
            aria-label="Add subtask"
            title="Add subtask"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(node);
            }}
          >
            <Plus size={13} />
          </button>
        </div>

        {effort > 0 && (
          <span className="card-effort" title="Effort estimate">
            <Zap size={12} />
            <span>{effort}</span>
          </span>
        )}
      </footer>
    </article>
  );
}