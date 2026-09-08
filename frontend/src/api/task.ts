import type {
  CreateTaskInput,
  GlobalStats,
  ListResult,
  Task,
  TaskDetail,
  TaskListParams,
  UpdateTaskInput,
} from '../types/task';
import { buildQuery, request } from './client';

const API = '/api';

export function listTasks(params: TaskListParams = {}): Promise<ListResult> {
  return request<ListResult>(`${API}/tasks${buildQuery(params)}`);
}

export function getTask(id: number): Promise<TaskDetail> {
  return request<TaskDetail>(`${API}/tasks/${id}`);
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return request<Task>(`${API}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createSubtask(parentId: number, input: CreateTaskInput): Promise<Task> {
  return request<Task>(`${API}/tasks/${parentId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  return request<Task>(`${API}/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`${API}/tasks/${id}`, { method: 'DELETE' });
}

export function getStats(): Promise<GlobalStats> {
  return request<GlobalStats>(`${API}/stats`);
}