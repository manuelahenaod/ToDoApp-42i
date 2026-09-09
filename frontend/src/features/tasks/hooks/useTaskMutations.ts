import { useCallback, useState } from 'react';
import * as api from '../api/task';
import type { CreateTaskInput, UpdateTaskInput } from '../types/task';

export function useTaskMutations() {
  const [pending, setPending] = useState(false);

  const wrap = useCallback((op: () => Promise<unknown>): Promise<unknown> => {
    setPending(true);
    return op().finally(() => setPending(false));
  }, []);

  const create = useCallback(
    (input: CreateTaskInput) => wrap(() => api.createTask(input)),
    [wrap]
  );
  const update = useCallback(
    (id: number, input: UpdateTaskInput) => wrap(() => api.updateTask(id, input)),
    [wrap]
  );
  const remove = useCallback((id: number) => wrap(() => api.deleteTask(id)), [wrap]);
  const createSubtask = useCallback(
    (parentId: number, input: CreateTaskInput) => wrap(() => api.createSubtask(parentId, input)),
    [wrap]
  );

  return { pending, create, update, remove, createSubtask };
}