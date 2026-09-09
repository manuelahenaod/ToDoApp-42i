import { describe, expect, it } from 'vitest';
import { taskProgress } from '../src/utils/taskProgress';
import type { TaskNode } from '../src/types/task';

function node(partial: Partial<TaskNode> = {}): TaskNode {
  return {
    id: 1,
    title: 'Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    effort_estimate: null,
    parent_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    subtasks: [],
    ...partial,
  };
}

describe('taskProgress', () => {
  it('returns 100 for a single done task', () => {
    expect(taskProgress(node({ status: 'done' }))).toBe(100);
  });

  it('returns 0 for a single todo task', () => {
    expect(taskProgress(node())).toBe(0);
  });

  it('counts the whole subtree, including subtasks', () => {
    const root = node({
      status: 'done',
      subtasks: [node({ id: 2, status: 'done' }), node({ id: 3, status: 'todo' })],
    });
    expect(taskProgress(root)).toBe(67); // 2 done of 3 nodes, rounded
  });

  it('rounds partial progress down', () => {
    const root = node({ status: 'todo', subtasks: [node({ id: 2, status: 'done' })] });
    expect(taskProgress(root)).toBe(50);
  });

  it('is 100 when every node in the tree is done', () => {
    const root = node({
      status: 'done',
      subtasks: [node({ id: 2, status: 'done', subtasks: [node({ id: 3, status: 'done' })] })],
    });
    expect(taskProgress(root)).toBe(100);
  });
});