import pool from '../db/pool';
import { aggregateEffort, type EffortStats } from './tasks';

export async function getGlobalStats(): Promise<EffortStats> {
  const { rows } = await pool.query('SELECT id, status, effort_estimate, parent_id FROM tasks');
  return aggregateEffort(rows);
}