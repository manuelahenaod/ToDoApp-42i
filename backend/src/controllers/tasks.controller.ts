import type { Request, Response } from 'express';
import * as taskService from '../services/tasks.service';
import type { TaskSortKey, TaskSortOrder } from '../services/tasks.service';
import { ValidationError } from '../errors/http-errors';
import type { TaskPriority, TaskStatus } from '../types';

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid task id');
  }
  return id;
}

function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export const tasksController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await taskService.listTasks({
      status: queryString(req.query.status) as TaskStatus | undefined,
      priority: queryString(req.query.priority) as TaskPriority | undefined,
      sort: queryString(req.query.sort) as TaskSortKey | undefined,
      order: queryString(req.query.order) as TaskSortOrder | undefined,
      page: Number(queryString(req.query.page)) || 1,
      limit: Number(queryString(req.query.limit)) || 50,
    });
    res.json(result);
  },

  async create(req: Request, res: Response): Promise<void> {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const task = await taskService.getTask(parseId(String(req.params.id)));
    res.json(task);
  },

  async update(req: Request, res: Response): Promise<void> {
    const task = await taskService.updateTask(parseId(String(req.params.id)), req.body);
    res.json(task);
  },

  async remove(req: Request, res: Response): Promise<void> {
    await taskService.deleteTask(parseId(String(req.params.id)));
    res.status(204).end();
  },

  async createSubtask(req: Request, res: Response): Promise<void> {
    const task = await taskService.createSubtask(parseId(String(req.params.id)), req.body);
    res.status(201).json(task);
  },
};