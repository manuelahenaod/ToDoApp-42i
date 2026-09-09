import { describe, expect, it } from 'vitest';
import { countRootStatuses } from '../src/services/stats.service';
import type { TaskStatusParent } from '../src/services/stats.service';

function task(id: number, parent_id: number | null, status: TaskStatusParent['status']): TaskStatusParent {
  return { id, parent_id, status };
}

describe('countRootStatuses', () => {
  it('returns all zeros when there are no tasks', () => {
    expect(countRootStatuses([])).toEqual({ todo: 0, in_progress: 0, done: 0, total: 0 });
  });

  it('counts a childless root with its own status', () => {
    const rows = [task(1, null, 'in_progress')];
    expect(countRootStatuses(rows)).toEqual({ todo: 0, in_progress: 1, done: 0, total: 1 });
  });

  it('counts a root as done when all its leaves are done', () => {
    const rows = [
      task(1, null, 'todo'),
      task(2, 1, 'done'),
      task(3, 1, 'done'),
    ];
    expect(countRootStatuses(rows)).toEqual({ todo: 0, in_progress: 0, done: 1, total: 1 });
  });

  it('counts a root as in_progress when any descendant is in progress', () => {
    const rows = [
      task(1, null, 'todo'),
      task(2, 1, 'done', ),
      task(3, 2, 'in_progress'),
    ];
    expect(countRootStatuses(rows)).toEqual({ todo: 0, in_progress: 1, done: 0, total: 1 });
  });

  it('aggregates the counts of every root', () => {
    const rows = [
      task(1, null, 'todo'),
      task(2, null, 'todo'),
      task(3, null, 'done'),
      task(4, 1, 'done'),
      task(5, 2, 'todo'),
    ];
    // root 1 derives done; root 2 stays todo; root 3 is done
    expect(countRootStatuses(rows)).toEqual({ todo: 1, in_progress: 0, done: 2, total: 3 });
  });

  it('promotes a task with a missing parent to root', () => {
    const rows = [task(1, 999, 'todo')];
    expect(countRootStatuses(rows)).toEqual({ todo: 1, in_progress: 0, done: 0, total: 1 });
  });
});