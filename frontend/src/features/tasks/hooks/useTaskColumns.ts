import { useEffect, useState } from 'react';
import { listTasks } from '../api/task';
import type {
  ListResult,
  SortOrder,
  TaskNode,
  TaskPriority,
  TaskSortKey,
  TaskStatus,
} from '../types/task';

const BOARD_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export type ColumnState = { tasks: TaskNode[]; total: number };

type Columns = Record<TaskStatus, ColumnState>;

const initialColumns = (): Columns => ({
  todo: { tasks: [], total: 0 },
  in_progress: { tasks: [], total: 0 },
  done: { tasks: [], total: 0 },
});

export function useTaskColumns(
  priority: TaskPriority | undefined,
  sortKey: TaskSortKey,
  sortOrder: SortOrder,
  limits: Record<TaskStatus, number>,
  refreshKey: number
): Columns {
  const [columns, setColumns] = useState<Columns>(initialColumns);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      BOARD_STATUSES.map((status) =>
        listTasks({ status, priority, limit: limits[status], sort: sortKey, order: sortOrder })
          .then((res: ListResult) => ({ status, tasks: res.tasks, total: res.total }))
          .catch(() => ({ status, tasks: [] as TaskNode[], total: 0 }))
      )
    ).then((results) => {
      if (cancelled) return;
      setColumns((prev) => {
        const next: Columns = { ...prev };
        for (const r of results) next[r.status] = { tasks: r.tasks, total: r.total };
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, limits, priority, sortKey, sortOrder]);

  return columns;
}