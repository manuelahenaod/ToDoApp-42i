import { describe, expect, it } from 'vitest';
import { PRIORITY_LABELS, STATUS_LABELS } from '../src/types/labels';
import type { TaskPriority, TaskStatus } from '../src/types/task';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

describe('STATUS_LABELS', () => {
  it('has a label for every status value', () => {
    for (const status of STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('does not contain extra keys', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(STATUSES.length);
  });
});

describe('PRIORITY_LABELS', () => {
  it('has a label for every priority value', () => {
    for (const priority of PRIORITIES) {
      expect(PRIORITY_LABELS[priority]).toBeTruthy();
    }
  });

  it('does not contain extra keys', () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(PRIORITIES.length);
  });
});