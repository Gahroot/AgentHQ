import { taskModel } from './task.model';
import { generateId } from '../../utils/id';

export const taskService = {
  async createTask(orgId: string, data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    assigned_type?: string;
    created_by: string;
    created_by_type: string;
    channel_id?: string;
    due_date?: string;
    metadata?: Record<string, unknown>;
  }) {
    return taskModel().create({
      id: generateId(),
      org_id: orgId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      assigned_to: data.assigned_to || null,
      assigned_type: data.assigned_type || null,
      created_by: data.created_by,
      created_by_type: data.created_by_type,
      channel_id: data.channel_id || null,
      due_date: data.due_date ? new Date(data.due_date) : null,
      metadata: data.metadata || {},
    });
  },

  async getTask(id: string, orgId: string) {
    return taskModel().findById(id, orgId);
  },

  async listTasks(orgId: string, filters: { status?: string; priority?: string; assigned_to?: string; created_by?: string; channel_id?: string }, limit: number, offset: number) {
    const [tasks, total] = await Promise.all([
      taskModel().findByOrg(orgId, filters, limit, offset),
      taskModel().countByOrg(orgId, filters),
    ]);
    return { tasks, total };
  },

  async updateTask(id: string, orgId: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: string;
    assigned_type: string;
    channel_id: string;
    due_date: string;
    metadata: Record<string, unknown>;
  }>) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.due_date) {
      updateData.due_date = new Date(data.due_date);
    }
    if (data.status === 'completed') {
      updateData.completed_at = new Date();
    }
    return taskModel().update(id, orgId, updateData);
  },

  async deleteTask(id: string, orgId: string) {
    return taskModel().delete(id, orgId);
  },
};
