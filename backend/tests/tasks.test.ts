import { describe, expect, it } from 'vitest';
import type { Task, TaskNode, TaskPriority, TaskStatus } from '../src/types';
import { NotFoundError, ValidationError } from '../src/errors/http-errors';
import { parseId } from '../src/controllers/tasks.controller';
import {
  MAX_TITLE_LENGTH,
  aggregateEffort,
  assertNoCyclicParent,
  buildSubtree,
  buildTree,
  deriveStatus,
  eachSubtreeEffort,
  flattenNode,
  prepareTaskList,
  stampEffort,
  stampStatus,
  validateEffort,
  validatePriority,
  validateStatus,
  validateTitle,
} from '../src/services/tasks.service';

function makeTask(partial: Partial<Task> & { id: number }): Task {
  return {
    title: 'Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    effort_estimate: null,
    parent_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function makeNode(id: number, status: TaskStatus, subtasks: TaskNode[] = []): TaskNode {
  return {
    ...makeTask({ id, status }),
    subtasks,
  };
}

describe('parseId', () => {
  it('parses a valid positive integer', () => {
    expect(parseId('1')).toBe(1);
    expect(parseId('42')).toBe(42);
  });

  it.each(['0', '-1', '1.5', 'abc', 'NaN'])('rejects "%s"', (raw) => {
    expect(() => parseId(raw)).toThrow(ValidationError);
  });
});

describe('validateTitle', () => {
  it('trims surrounding whitespace', () => {
    expect(validateTitle('  hello world  ')).toBe('Hello world');
  });

  it('capitalizes the first letter', () => {
    expect(validateTitle('build the api')).toBe('Build the api');
  });

  it('rejects undefined, empty and whitespace-only titles', () => {
    expect(() => validateTitle(undefined)).toThrow('title is required');
    expect(() => validateTitle('')).toThrow('title must not be empty');
    expect(() => validateTitle('   ')).toThrow('title must not be empty');
  });

  it('rejects titles longer than the maximum length', () => {
    expect(() => validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1))).toThrow(
      `${MAX_TITLE_LENGTH} characters or fewer`
    );
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH)).length).toBe(MAX_TITLE_LENGTH);
  });
});

describe('validateEffort', () => {
  it('passes through undefined and null', () => {
    expect(validateEffort(undefined)).toBeUndefined();
    expect(validateEffort(null)).toBeNull();
  });

  it('accepts non-negative integers', () => {
    expect(validateEffort(0)).toBe(0);
    expect(validateEffort(7)).toBe(7);
  });

  it.each([-1, 1.5, NaN])('rejects invalid effort %s', (value) => {
    expect(() => validateEffort(value)).toThrow(ValidationError);
  });

  it('rejects non-numeric values', () => {
    expect(() => validateEffort('3' as unknown as number)).toThrow(ValidationError);
  });
});

describe('validateStatus / validatePriority', () => {
  it.each(['todo', 'in_progress', 'done'] as TaskStatus[])('accepts status %s', (status) => {
    expect(validateStatus(status)).toBe(status);
  });

  it.each(['low', 'medium', 'high', 'critical'] as TaskPriority[])('accepts priority %s', (priority) => {
    expect(validatePriority(priority)).toBe(priority);
  });

  it('rejects unknown statuses and priorities', () => {
    expect(() => validateStatus('blocked' as TaskStatus)).toThrow(ValidationError);
    expect(() => validatePriority('urgent' as TaskPriority)).toThrow(ValidationError);
  });
});

describe('deriveStatus', () => {
  it('defaults to todo with no children', () => {
    expect(deriveStatus([])).toBe('todo');
  });

  it('returns done when every child is done', () => {
    expect(deriveStatus(['done', 'done'])).toBe('done');
  });

  it('returns todo when every child is todo', () => {
    expect(deriveStatus(['todo', 'todo'])).toBe('todo');
  });

  it('returns in_progress on mixed or partial progress', () => {
    expect(deriveStatus(['todo', 'in_progress', 'done'])).toBe('in_progress');
    expect(deriveStatus(['todo', 'done'])).toBe('in_progress');
  });
});

describe('stampStatus', () => {
  it('keeps the own status of tasks without subtasks', () => {
    const nodes = stampStatus([makeNode(1, 'in_progress')]);
    expect(nodes[0].status).toBe('in_progress');
  });

  it('derives done when all leaves are done', () => {
    const nodes = stampStatus([
      makeNode(1, 'todo', [makeNode(2, 'done'), makeNode(3, 'done')]),
    ]);
    expect(nodes[0].status).toBe('done');
  });

  it('derives in_progress when any descendant is in progress', () => {
    const nodes = stampStatus([
      makeNode(1, 'todo', [
        makeNode(2, 'done', [makeNode(4, 'in_progress')]),
        makeNode(3, 'done'),
      ]),
    ]);
    expect(nodes[0].subtasks[0].status).toBe('in_progress');
    expect(nodes[0].status).toBe('in_progress');
  });
});

describe('buildTree / buildSubtree / flattenNode', () => {
  const tasks: Task[] = [
    makeTask({ id: 1 }),
    makeTask({ id: 2, parent_id: 1 }),
    makeTask({ id: 3, parent_id: 1 }),
    makeTask({ id: 4, parent_id: 2 }),
    makeTask({ id: 5 }),
    makeTask({ id: 6, parent_id: 999 }), // orphan: missing parent
  ];

  it('builds roots in input order and keeps child order', () => {
    const roots = buildTree(tasks);
    expect(roots.map((r) => r.id)).toEqual([1, 5, 6]);
    expect(roots[0].subtasks.map((c) => c.id)).toEqual([2, 3]);
    expect(roots[1].subtasks).toEqual([]);
  });

  it('promotes tasks whose parent is missing to root', () => {
    const roots = buildTree(tasks);
    expect(roots.map((r) => r.id)).toContain(6);
  });

  it('retrieves a subtree with its descendants', () => {
    const subtree = buildSubtree(tasks, 2);
    expect(subtree?.id).toBe(2);
    expect(subtree?.subtasks.map((c) => c.id)).toEqual([4]);
  });

  it('returns undefined for a missing root', () => {
    expect(buildSubtree(tasks, 404)).toBeUndefined();
  });

  it('flattens a node depth-first, parent first', () => {
    const root = buildTree(tasks)[0];
    expect(flattenNode(root).map((t) => t.id)).toEqual([1, 2, 4, 3]);
  });
});

describe('aggregateEffort', () => {
  it('counts only leaves, grouped by their own status', () => {
    const stats = aggregateEffort([
      makeTask({ id: 1, status: 'done', effort_estimate: 5 }),
      makeTask({ id: 2, parent_id: 1, status: 'done', effort_estimate: 3 }),
      makeTask({ id: 3, parent_id: 1, status: 'todo', effort_estimate: 2 }),
    ]);
    expect(stats).toEqual({ todo: 2, in_progress: 0, done: 3, total: 5 });
  });

  it('treats missing effort as zero', () => {
    const stats = aggregateEffort([makeTask({ id: 1, status: 'todo', effort_estimate: null })]);
    expect(stats).toEqual({ todo: 0, in_progress: 0, done: 0, total: 0 });
  });

  it('counts a childless root own effort', () => {
    const stats = aggregateEffort([makeTask({ id: 1, status: 'in_progress', effort_estimate: 4 })]);
    expect(stats.total).toBe(4);
    expect(stats.in_progress).toBe(4);
  });
});

describe('eachSubtreeEffort', () => {
  it('sums effort bottom-up, ignoring effort of tasks with children', () => {
    const effort = eachSubtreeEffort([
      makeTask({ id: 1, effort_estimate: 99 }), // root, has children -> own effort ignored
      makeTask({ id: 2, parent_id: 1, effort_estimate: 3 }), // internal, has child -> own effort ignored
      makeTask({ id: 3, parent_id: 1, effort_estimate: 4 }), // leaf
      makeTask({ id: 4, parent_id: 2, effort_estimate: null }), // leaf, no effort
    ]);
    expect(effort.get(4)).toBe(0);
    expect(effort.get(2)).toBe(0);
    expect(effort.get(3)).toBe(4);
    expect(effort.get(1)).toBe(4);
  });
});

describe('stampEffort', () => {
  it('stamps total_effort recursively from the map', () => {
    const effort = new Map([
      [1, 7],
      [2, 3],
      [3, 4],
    ]);
    const root = stampEffort([makeNode(1, 'todo', [makeNode(2, 'todo'), makeNode(3, 'todo')])], effort);
    expect(root[0].total_effort).toBe(7);
    expect(root[0].subtasks[0].total_effort).toBe(3);
  });
});

describe('prepareTaskList', () => {
  // After stampStatus: root 1 derives 'done' from its leaf; roots 3 (todo) and 4 (in_progress) stay.
  // total_effort: root 1 = 10 (rollup of leaf 2); roots 3 and 4 = 0.
  const tasks: Task[] = [
    makeTask({
      id: 1,
      title: 'Alpha',
      priority: 'high',
      created_at: '2026-01-01T00:00:00.000Z',
    }),
    makeTask({ id: 2, parent_id: 1, title: 'Sub', effort_estimate: 10, status: 'done' }),
    makeTask({
      id: 3,
      title: 'Beta',
      priority: 'high',
      created_at: '2026-01-03T00:00:00.000Z',
    }),
    makeTask({
      id: 4,
      title: 'Gamma',
      priority: 'low',
      status: 'in_progress',
      created_at: '2026-01-02T00:00:00.000Z',
    }),
  ];

  it('sorts by priority asc by default, breaking ties by created date', () => {
    const { tasks: listed } = prepareTaskList(tasks);
    expect(listed.map((t) => t.id)).toEqual([1, 3, 4]);
  });

  it('sorts by title ascending and descending', () => {
    expect(prepareTaskList(tasks, { sort: 'title', order: 'asc' }).tasks.map((t) => t.id)).toEqual([1, 3, 4]);
    expect(prepareTaskList(tasks, { sort: 'title', order: 'desc' }).tasks.map((t) => t.id)).toEqual([4, 3, 1]);
  });

  it('sorts by total effort ascending and descending', () => {
    expect(prepareTaskList(tasks, { sort: 'effort', order: 'asc' }).tasks.map((t) => t.id)).toEqual([4, 3, 1]);
    expect(prepareTaskList(tasks, { sort: 'effort', order: 'desc' }).tasks.map((t) => t.id)).toEqual([1, 3, 4]);
  });

  it('sorts by created_at and by status', () => {
    const byCreatedDesc = prepareTaskList(tasks, { sort: 'created_at', order: 'desc' }).tasks.map((t) => t.id);
    expect(byCreatedDesc).toEqual([3, 4, 1]);
    const byStatusAsc = prepareTaskList(tasks, { sort: 'status', order: 'asc' }).tasks.map((t) => t.id);
    expect(byStatusAsc).toEqual([3, 4, 1]); // todo (3) < in_progress (4) < done (1)
  });

  it('filters by status and priority', () => {
    const onlyDone = prepareTaskList(tasks, { status: 'done' });
    expect(onlyDone.tasks.map((t) => t.id)).toEqual([1]);
    expect(onlyDone.total).toBe(1);

    const onlyHigh = prepareTaskList(tasks, { priority: 'high' });
    expect(onlyHigh.tasks.map((t) => t.id)).toEqual([1, 3]);
  });

  it('paginates and reports the filtered total', () => {
    const page2 = prepareTaskList(tasks, { page: 2, limit: 2 });
    expect(page2.tasks.map((t) => t.id)).toEqual([4]);
    expect(page2.total).toBe(3);

    expect(prepareTaskList(tasks, { page: 0, limit: 1 }).tasks.map((t) => t.id)).toEqual([1]);
    expect(prepareTaskList(tasks, { limit: 10_000 }).tasks.length).toBeLessThanOrEqual(100);
  });

  it('rejects invalid filter values', () => {
    expect(() => prepareTaskList(tasks, { sort: 'bogus' as never })).toThrow(ValidationError);
    expect(() => prepareTaskList(tasks, { order: 'sideways' as never })).toThrow(ValidationError);
    expect(() => prepareTaskList(tasks, { status: 'blocked' as never })).toThrow(ValidationError);
  });
});

describe('assertNoCyclicParent', () => {
  // A(1) -> B(2) -> C(3)
  const rels = [
    { id: 1, parent_id: null },
    { id: 2, parent_id: 1 },
    { id: 3, parent_id: 2 },
  ];

  it('rejects setting a task as its own parent', () => {
    expect(() => assertNoCyclicParent(rels, 1, 1)).toThrow(ValidationError);
  });

  it('rejects a direct descendant as parent', () => {
    expect(() => assertNoCyclicParent(rels, 1, 2)).toThrow(ValidationError);
  });

  it('rejects a deep descendant as parent', () => {
    expect(() => assertNoCyclicParent(rels, 1, 3)).toThrow(ValidationError);
  });

  it('rejects a nonexistent parent', () => {
    expect(() => assertNoCyclicParent(rels, 1, 404)).toThrow(NotFoundError);
  });

  it('allows moving a task to an unrelated or ancestor position', () => {
    expect(() => assertNoCyclicParent(rels, 3, 1)).not.toThrow();
    expect(() => assertNoCyclicParent(rels, 3, 2)).not.toThrow();
    expect(() => assertNoCyclicParent([{ id: 5, parent_id: null }], 5, 5)).toThrow();
  });
});