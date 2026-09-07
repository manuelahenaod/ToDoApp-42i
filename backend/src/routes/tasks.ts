import { Router } from 'express';
import type { TaskPriority, TaskStatus } from '../types';
import * as taskService from '../services/tasks';
import { parseId } from '../services/tasks';

const router = Router();

type AsyncHandler = (
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) => Promise<unknown>;

const asyncHandler = (fn: AsyncHandler) => (req: any, res: any, next: any) =>
  fn(req, res, next).catch(next);

function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

router.get('/', asyncHandler(async (req, res) => {
  const status = queryString(req.query.status) as TaskStatus | undefined;
  const priority = queryString(req.query.priority) as TaskPriority | undefined;
  const page = Number(queryString(req.query.page)) || 1;
  const limit = Number(queryString(req.query.limit)) || 50;

  const result = await taskService.listTasks({
    status,
    priority,
    page,
    limit,
  });
  res.json(result);
}));

router.post('/', asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body);
  res.status(201).json(task);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const task = await taskService.getTask(parseId(String(req.params.id)));
  res.json(task);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(parseId(String(req.params.id)), req.body);
  res.json(task);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await taskService.deleteTask(parseId(String(req.params.id)));
  res.status(204).end();
}));

router.post('/:id/subtasks', asyncHandler(async (req, res) => {
  const task = await taskService.createSubtask(parseId(String(req.params.id)), req.body);
  res.status(201).json(task);
}));

export default router;