import pool from '../db/pool';
import type { TaskStatus } from '../types';

export interface TaskStatusParent {
  id: number;
  status: TaskStatus;
  parent_id: number | null;
}

export const statsRepository = {
  async findIdStatusParents(): Promise<TaskStatusParent[]> {
    const { rows } = await pool.query('SELECT id, status, parent_id FROM tasks');
    return rows;
  },
};