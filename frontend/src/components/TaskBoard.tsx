import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listTasks } from '../api/task';
import type { ListResult, TaskNode, TaskStatus } from '../types/task';
import { PriorityTag } from './Badge';
import ProgressBar from './ProgressBar';
import './TaskBoard.css';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const INITIAL_LIMIT = 4;
const STEP = 5;

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

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      COLUMNS.map(({ id }) =>
        listTasks({ status: id, limit: limits[id], sort: 'created_at', order: 'desc' })
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
  }, [refreshKey, limits]);

  const loadMore = (status: TaskStatus) =>
    setLimits((l) => ({ ...l, [status]: l[status] + STEP }));

  return (
    <div className="board">
      {COLUMNS.map(({ id, label }) => {
        const column = columns[id];
        const shown = limits[id];
        const hasMore = column.total > shown;
        const isExpanded = shown > INITIAL_LIMIT;
        return (
          <section key={id} className="column">
            <header className={`column-head column-head--${id}`}>
              <span className="column-title">{label}</span>
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
                      + Load more
                    </button>
                  )}
                  {isExpanded && (
                    <button type="button" className="show-less" onClick={() => setLimits((l) => ({ ...l, [id]: INITIAL_LIMIT }))}>
                      – Show less
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
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
    <article className={`card${isDone ? ' card--done' : ''}`} onClick={onOpen}>
      <h3 className="card-title">{node.title}</h3>
      {node.description && <p className="card-desc">{node.description}</p>}

      <div className="card-mid">
        <div className="card-prio">
          <PriorityTag priority={node.priority} />
        </div>
        <ProgressBar node={node} />
      </div>

      <footer className="card-foot">
        {node.subtasks.length > 0 ? (
          <Link className="card-subtasks" to={`/tasks/${node.id}`} onClick={(e) => e.stopPropagation()}>
            {node.subtasks.length} subtareas →
          </Link>
        ) : (
          <span className="card-subtasks card-subtasks--none">0 subtareas</span>
        )}
        <button
          type="button"
          className="icon-btn"
          aria-label="Add subtask"
          onClick={(e) => {
            e.stopPropagation();
            onAddSubtask(node);
          }}
        >
          +
        </button>
        <span className="card-effort">{effort}</span>
      </footer>
    </article>
  );
}