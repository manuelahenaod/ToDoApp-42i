import type { TaskNode } from '../types/task';

export function taskProgress(node: TaskNode): number {
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