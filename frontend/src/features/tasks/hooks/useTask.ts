import { useCallback, useEffect, useState } from 'react';
import { getTask } from '../api/task';
import type { TaskDetail } from '../types/task';

export interface UseTaskResult {
  task: TaskDetail | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function useTask(id: number): UseTaskResult {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getTask(id)
      .then((t) => {
        setTask(t);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unexpected error.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { task, error, loading, reload };
}