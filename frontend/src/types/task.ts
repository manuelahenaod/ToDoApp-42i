export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  effort_estimate: number | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskNode extends Task {
  subtasks: TaskNode[];
  total_effort?: number;
}

export interface ListResult {
  tasks: TaskNode[];
  total: number;
  offset: number;
  limit: number;
  page: number;
  pages: number;
}

export interface GlobalStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export interface TaskSummary {
  id: number;
  title: string;
}

export interface EffortStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export interface TaskDetail extends TaskNode {
  effort: EffortStats;
  parents: TaskSummary[];
}

export type TaskSortKey = 'title' | 'status' | 'priority' | 'effort' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface TaskListParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
  sort?: TaskSortKey;
  order?: SortOrder;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  effort_estimate?: number;
  parent_id?: number;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
  effort_estimate?: number | null;
  parent_id?: number | null;
};
