import pool from '../db/pool';
import type { Task, TaskPriority, TaskStatus } from '../types';

export interface TaskIdParent {
  id: number;
  parent_id: number | null;
}

export interface TaskInsertInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  effort_estimate: number | null;
  parent_id: number | null;
}

export interface FieldValuePair {
  column: string;
  value: unknown;
}

export const taskRepository = {
  async findById(id: number): Promise<Task | undefined> {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0];
  },

  async findAll(): Promise<Task[]> {
    const { rows } = await pool.query('SELECT * FROM tasks');
    return rows;
  },

  async hasChildren(id: number): Promise<boolean> {
    const { rows } = await pool.query('SELECT 1 FROM tasks WHERE parent_id = $1 LIMIT 1', [id]);
    return rows.length > 0;
  },

  async findIdAndParents(): Promise<TaskIdParent[]> {
    const { rows } = await pool.query('SELECT id, parent_id FROM tasks');
    return rows;
  },

  async insert(input: TaskInsertInput): Promise<Task> {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, effort_estimate, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.title,
        input.description,
        input.status,
        input.priority,
        input.effort_estimate,
        input.parent_id,
      ]
    );
    return rows[0];
  },

  async clearEffortIfHasChildren(taskIds: number[]): Promise<void> {
    for (const id of taskIds) {
      await pool.query(
        `UPDATE tasks SET effort_estimate = NULL
         WHERE id = $1 AND EXISTS (SELECT 1 FROM tasks WHERE parent_id = $1)`,
        [id]
      );
    }
  },

  async update(id: number, fields: FieldValuePair[]): Promise<Task | undefined> {
    if (fields.length === 0) return this.findById(id);
    const setClause = fields.map((f, i) => `${f.column} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE tasks SET ${setClause}, updated_at = NOW()
       WHERE id = $${fields.length + 1} RETURNING *`,
      [...fields.map((f) => f.value), id]
    );
    return rows[0];
  },

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};