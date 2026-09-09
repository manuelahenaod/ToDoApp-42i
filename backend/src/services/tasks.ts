import pool from '../db/pool';
import { NotFoundError, ValidationError } from './errors';
import type {
  CreateTaskInput,
  EffortStats,
  Task,
  TaskDetail,
  TaskNode,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  UpdateTaskInput,
} from '../types';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
const VALID_SORT_KEYS: TaskSortKey[] = ['title', 'status', 'priority', 'effort', 'created_at'];
const VALID_SORT_ORDERS: TaskSortOrder[] = ['asc', 'desc'];

export type TaskSortKey = 'title' | 'status' | 'priority' | 'effort' | 'created_at';
export type TaskSortOrder = 'asc' | 'desc';

export interface ListTasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
  sort?: TaskSortKey;
  order?: TaskSortOrder;
}

export interface ListTasksResult {
  tasks: TaskNode[];
  total: number;
}

// ---------- validation ----------

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid task id');
  }
  return id;
}

export const MAX_TITLE_LENGTH = 255;

function capitalizeFirst(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

function validateTitle(title?: string): string {
  if (title === undefined) {
    throw new ValidationError('title is required');
  }
  const trimmed = title.trim();
  if (!trimmed) {
    throw new ValidationError('title must not be empty');
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }
  return capitalizeFirst(trimmed);
}

function validateEffort(effort?: number | null): number | null | undefined {
  if (effort === undefined || effort === null) return effort;
  if (typeof effort !== 'number' || !Number.isInteger(effort) || effort < 0) {
    throw new ValidationError('effort_estimate must be a non-negative integer');
  }
  return effort;
}

function validateStatus(status?: TaskStatus): TaskStatus | undefined {
  if (status === undefined) return undefined;
  if (!VALID_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  return status;
}

function validatePriority(priority?: TaskPriority): TaskPriority | undefined {
  if (priority === undefined) return undefined;
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new ValidationError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  return priority;
}

function validateSortKey(sort?: TaskSortKey): TaskSortKey | undefined {
  if (sort === undefined) return undefined;
  if (!VALID_SORT_KEYS.includes(sort)) {
    throw new ValidationError(`sort must be one of: ${VALID_SORT_KEYS.join(', ')}`);
  }
  return sort;
}

function validateSortOrder(order?: TaskSortOrder): TaskSortOrder | undefined {
  if (order === undefined) return undefined;
  if (!VALID_SORT_ORDERS.includes(order)) {
    throw new ValidationError(`order must be one of: ${VALID_SORT_ORDERS.join(', ')}`);
  }
  return order;
}

async function requireTask(id: number): Promise<Task> {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw new NotFoundError('Task not found');
  }
  return rows[0];
}

// Leaf-only rule: if a task has children, it loses its own effort (only leaves count)
async function clearEffortIfHasChildren(taskIds: number[]): Promise<void> {
  for (const id of taskIds) {
    await pool.query(
      `UPDATE tasks SET effort_estimate = NULL
       WHERE id = $1 AND EXISTS (SELECT 1 FROM tasks WHERE parent_id = $1)`,
      [id]
    );
  }
}

// ---------- pure helpers (unit-testable without a DB) ----------

export function buildTree(tasks: Task[]): TaskNode[] {
  const nodes = new Map<number, TaskNode>();
  for (const task of tasks) {
    nodes.set(task.id, { ...task, subtasks: [] });
  }
  const roots: TaskNode[] = [];
  for (const task of tasks) {
    const node = nodes.get(task.id)!;
    if (task.parent_id !== null && nodes.has(task.parent_id)) {
      nodes.get(task.parent_id)!.subtasks.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function buildSubtree(tasks: Task[], rootId: number): TaskNode | undefined {
  const stack = [...buildTree(tasks)];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === rootId) return node;
    stack.push(...node.subtasks);
  }
  return undefined;
}

export function flattenNode(node: TaskNode): Task[] {
  const acc: Task[] = [node];
  for (const child of node.subtasks) {
    acc.push(...flattenNode(child));
  }
  return acc;
}

// Sums the effort of leaf nodes grouped by their own status
export function aggregateEffort(tasks: Task[]): EffortStats {
  const parents = new Set(
    tasks.filter((t) => t.parent_id !== null).map((t) => t.parent_id as number)
  );
  const stats: EffortStats = { todo: 0, in_progress: 0, done: 0, total: 0 };
  for (const task of tasks) {
    if (parents.has(task.id)) continue;
    const effort = task.effort_estimate ?? 0;
    stats[task.status] += effort;
    stats.total += effort;
  }
  return stats;
}

// Total effort of every subtree (roots included)
export function eachSubtreeEffort(tasks: Task[]): Map<number, number> {
  const byId = new Map<number, Task>();
  const children = new Map<number, number[]>();
  for (const t of tasks) {
    byId.set(t.id, t);
    if (t.parent_id !== null) {
      const list = children.get(t.parent_id) ?? [];
      list.push(t.id);
      children.set(t.parent_id, list);
    }
  }

  const memo = new Map<number, number>();
  const sum = (id: number): number => {
    if (memo.has(id)) return memo.get(id)!;
    const kids = children.get(id) ?? [];
    let total = 0;
    if (kids.length === 0) {
      total = byId.get(id)?.effort_estimate ?? 0;
    } else {
      for (const kid of kids) total += sum(kid);
    }
    memo.set(id, total);
    return total;
  };

  const result = new Map<number, number>();
  for (const t of tasks) result.set(t.id, sum(t.id));
  return result;
}

// Stamps total_effort on every node (a task's rollup considered for its whole subtree)
export function stampEffort(nodes: TaskNode[], effort: Map<number, number>): TaskNode[] {
  for (const node of nodes) {
    node.total_effort = effort.get(node.id) ?? 0;
    stampEffort(node.subtasks, effort);
  }
  return nodes;
}

// A task's own status is derived from its direct children once it has subtasks
export function deriveStatus(childStatuses: TaskStatus[]): TaskStatus {
  if (childStatuses.length === 0) return 'todo';
  if (childStatuses.every((s) => s === 'done')) return 'done';
  if (childStatuses.every((s) => s === 'todo')) return 'todo';
  return 'in_progress';
}

// Derives the effective status bottom-up for every node that has subtasks
export function stampStatus(nodes: TaskNode[]): TaskNode[] {
  for (const node of nodes) {
    stampStatus(node.subtasks);
    if (node.subtasks.length > 0) {
      node.status = deriveStatus(node.subtasks.map((c) => c.status));
    }
  }
  return nodes;
}

// ---------- list queries (filters, sort, pagination in JS) ----------

export function prepareTaskList(
  all: Task[],
  filters: ListTasksFilters = {}
): ListTasksResult {
  const status = validateStatus(filters.status);
  const priority = validatePriority(filters.priority);
  const sort = validateSortKey(filters.sort);
  const order = validateSortOrder(filters.order);

  const effort = eachSubtreeEffort(all);
  const roots = stampStatus(stampEffort(buildTree(all), effort));

  let filtered = roots;
  if (status) filtered = filtered.filter((r) => r.status === status);
  if (priority) filtered = filtered.filter((r) => r.priority === priority);

  const sortKey = sort ?? 'priority';
  const sortOrder = order ?? 'asc';
  const rank: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };
  const dir = sortOrder === 'desc' ? -1 : 1;
  const byDate = (a: TaskNode, b: TaskNode) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

  const byKey = (a: TaskNode, b: TaskNode): number => {
    switch (sortKey) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'status':
        return statusOrder[a.status] - statusOrder[b.status];
      case 'effort':
        return (a.total_effort ?? 0) - (b.total_effort ?? 0);
      case 'created_at':
        return byDate(a, b);
      case 'priority':
      default:
        return rank[a.priority] - rank[b.priority];
    }
  };

  filtered = [...filtered].sort((a, b) => {
    const primary = byKey(a, b);
    return primary !== 0 ? primary * dir : dir * byDate(a, b);
  });

  const total = filtered.length;
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const start = (page - 1) * limit;

  const tasks = filtered.slice(start, start + limit);

  return { tasks, total };
}

// ---------- business operations ----------

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const title = validateTitle(input.title);
  const priority = validatePriority(input.priority);
  const effort = validateEffort(input.effort_estimate);

  const parentId = input.parent_id ?? null;
  if (parentId !== null) {
    await requireTask(parentId);
  }

  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, effort_estimate, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      title,
      input.description ?? '',
      'todo',
      priority ?? 'medium',
      effort ?? null,
      parentId,
    ]
  );

  const task = rows[0];
  if (parentId !== null) await clearEffortIfHasChildren([parentId]);
  return task;
}

export async function createSubtask(
  parentId: number,
  input: Omit<CreateTaskInput, 'parent_id'>
): Promise<Task> {
  await requireTask(parentId);
  return createTask({ ...input, parent_id: parentId });
}

export async function getTask(id: number): Promise<TaskDetail> {
  await requireTask(id);
  const { rows } = await pool.query('SELECT * FROM tasks');

  const byId = new Map<number, Task>();
  for (const row of rows) byId.set(row.id, row);

  const parents: TaskSummary[] = [];
  let cursor = byId.get(id)?.parent_id ?? null;
  while (cursor !== null) {
    const parent = byId.get(cursor);
    if (!parent) break;
    parents.push({ id: parent.id, title: parent.title });
    cursor = parent.parent_id;
  }
  parents.reverse();

  const effort = eachSubtreeEffort(rows);
  const node = stampStatus(stampEffort([buildSubtree(rows, id)!], effort))[0];
  return { ...node, effort: aggregateEffort(flattenNode(node)), parents };
}

export async function listTasks(filters?: ListTasksFilters): Promise<ListTasksResult> {
  const { rows } = await pool.query('SELECT * FROM tasks');
  return prepareTaskList(rows, filters);
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  await requireTask(id);

  const fields: string[] = [];
  const values: unknown[] = [];
  const param = () => `$${values.length + 1}`;

  if (input.title !== undefined) {
    fields.push(`title = ${param()}`);
    values.push(validateTitle(input.title));
  }
  if (input.description !== undefined) {
    fields.push(`description = ${param()}`);
    values.push(input.description);
  }
  if (input.status !== undefined) {
    const { rows: childRows } = await pool.query('SELECT 1 FROM tasks WHERE parent_id = $1 LIMIT 1', [id]);
    if (childRows.length > 0) {
      throw new ValidationError('cannot change the status of a task that has subtasks');
    }
    fields.push(`status = ${param()}`);
    values.push(validateStatus(input.status));
  }
  if (input.priority !== undefined) {
    fields.push(`priority = ${param()}`);
    values.push(validatePriority(input.priority));
  }
  if (input.effort_estimate !== undefined) {
    fields.push(`effort_estimate = ${param()}`);
    values.push(validateEffort(input.effort_estimate));
  }
  if (input.parent_id !== undefined) {
    const newParent = input.parent_id;
    if (newParent !== null) {
      const { rows } = await pool.query('SELECT id, parent_id FROM tasks');
      const byId = new Map(rows.map((r: { id: number;  parent_id: number | null }) => [r.id, r]));
      let cursor = byId.get(newParent);
      if (!cursor) throw new NotFoundError('parent task not found');
      while (cursor) {
        if (cursor.id === id) {
          throw new ValidationError('cannot set parent to itself or a descendant');
        }
        cursor =
          cursor.parent_id !== null ? byId.get(cursor.parent_id) : undefined;
      }
    }
    fields.push(`parent_id = ${param()}`);
    values.push(newParent);
  }

  if (fields.length === 0) return requireTask(id);

  const { rows } = await pool.query(
    `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = ${param()} RETURNING *`,
    [...values, id]
  );

  const task = rows[0];
  const gainedChildren = [id, task.parent_id].filter((v): v is number => v !== null);
  await clearEffortIfHasChildren(gainedChildren);
  return task;
}

export async function deleteTask(id: number): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  if (rowCount === 0) {
    throw new NotFoundError('Task not found');
  }
}