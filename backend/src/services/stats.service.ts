import type { TaskStatus } from '../types';
import { statsRepository } from '../repositories/stats.repository';
import { deriveStatus } from './tasks.service';

export interface TaskStatusParent {
  id: number;
  status: TaskStatus;
  parent_id: number | null;
}

export interface CountStats {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
}

// Pure: derives every root's effective status and counts roots.
// Mirrors the root semantics of buildTree (a node is a root when its parent is
// missing), so it stays correct even with orphaned rows.
export function countRootStatuses(rows: TaskStatusParent[]): CountStats {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const children = new Map<number, number[]>();
  for (const row of rows) {
    if (row.parent_id !== null && byId.has(row.parent_id)) {
      const list = children.get(row.parent_id) ?? [];
      list.push(row.id);
      children.set(row.parent_id, list);
    }
  }

  const statusOf = (id: number): TaskStatus => {
    const kids = children.get(id) ?? [];
    if (kids.length === 0) return byId.get(id)!.status;
    return deriveStatus(kids.map(statusOf));
  };

  const roots = rows.filter((row) => row.parent_id === null || !byId.has(row.parent_id));
  const counts: CountStats = { todo: 0, in_progress: 0, done: 0, total: roots.length };
  for (const root of roots) counts[statusOf(root.id)] += 1;
  return counts;
}

// Counts root tasks only; subtrees feed each root's derived status.
export async function getGlobalStats(): Promise<CountStats> {
  const rows = await statsRepository.findIdStatusParents();
  return countRootStatuses(rows);
}