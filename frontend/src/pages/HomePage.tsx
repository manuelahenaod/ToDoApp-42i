import { useCallback, useEffect, useState } from 'react';
import { createSubtask, getStats, listTasks, updateTask } from '../api/task';
import StatsBar from '../components/StatsBar';
import TaskForm from '../components/TaskForm';
import TaskList, { type SortConfig, type TaskFilters } from '../components/TaskList';
import type { GlobalStats, ListResult, TaskNode, TaskStatus } from '../types/task';

const PAGE_SIZE = 10;

interface HomePageProps {
  refreshKey: number;
}

export default function HomePage({ refreshKey }: HomePageProps) {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [data, setData] = useState<ListResult | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<SortConfig>({ key: 'created_at', order: 'desc' });
  const [page, setPage] = useState(1);
  const [bump, setBump] = useState(0);
  const [subtaskParent, setSubtaskParent] = useState<TaskNode | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [refreshKey, bump]);

  useEffect(() => {
    let cancelled = false;
    listTasks({ ...filters, sort: sort.key, order: sort.order, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, sort, page, refreshKey, bump]);

  const handleStatusChange = useCallback((id: number, status: TaskStatus) => {
    updateTask(id, { status })
      .then(() => {
        setData((prev) => {
          if (!prev) return prev;
          const walk = (nodes: TaskNode[]): boolean => {
            for (const n of nodes) {
              if (n.id === id) {
                n.status = status;
                return true;
              }
              if (walk(n.subtasks)) return true;
            }
            return false;
          };
          const tasks = [...prev.tasks];
          walk(tasks);
          return { ...prev, tasks };
        });
      })
      .catch(() => {
        window.location.reload();
      });
  }, []);

  return (
    <div>
      <StatsBar stats={stats} />
      {data ? (
        <TaskList
          data={data}
          filters={filters}
          sort={sort}
          page={page}
          onFilterChange={setFilters}
          onSortChange={setSort}
          onPageChange={setPage}
          onStatusChange={handleStatusChange}
          onAddSubtask={setSubtaskParent}
        />
      ) : (
        <div className="empty-state">
          <p>Loading tasks…</p>
          <p className="empty-hint">If this persists, check that the backend is running.</p>
        </div>
      )}

      {subtaskParent && (
        <TaskForm
          title={`Add subtask to “${subtaskParent.title}”`}
          submitLabel="Create subtask"
          onSubmit={async (input) => {
            await createSubtask(subtaskParent.id, input);
            setSubtaskParent(null);
            setBump((b) => b + 1);
          }}
          onClose={() => setSubtaskParent(null)}
        />
      )}
    </div>
  );
}