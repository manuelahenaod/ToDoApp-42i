import pool from '../db/pool';
import type { Task, TaskStatus } from '../types';
import { buildTree, stampStatus } from './tasks';

export interface CountStats {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
}

// Counts root tasks only; subtrees feed each root's derived status.
export async function getGlobalStats(): Promise<CountStats> {
  const { rows } = await pool.query('SELECT id, status, parent_id FROM tasks') as {
    rows: { id: number; status: TaskStatus; parent_id: number | null }[];
  };

  const roots = stampStatus(buildTree(rows as Task[]));
  const counts: CountStats = { todo: 0, in_progress: 0, done: 0, total: roots.length };

  for (const root of roots) {
    counts[root.status] += 1;
  }

  return counts;
}