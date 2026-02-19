'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task } from '@/types';
import { getTask, updateTask, deleteTask } from '@/lib/api/endpoints/tasks';
import { formatDateTime } from '@/lib/utils/date';
import {
  ArrowLeft, CheckCircle2, Circle, Clock, XCircle,
  ArrowUp, ArrowRight, ArrowDown, AlertTriangle,
  Calendar, Trash2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '@/components/posts/markdown-content';

const statusConfig = {
  open: { icon: Circle, label: 'Open', class: 'text-blue-500', bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  in_progress: { icon: Clock, label: 'In Progress', class: 'text-yellow-500', bgClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  completed: { icon: CheckCircle2, label: 'Completed', class: 'text-green-500', bgClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  cancelled: { icon: XCircle, label: 'Cancelled', class: 'text-muted-foreground', bgClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const priorityConfig = {
  low: { icon: ArrowDown, label: 'Low', class: 'text-muted-foreground', bgClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  medium: { icon: ArrowRight, label: 'Medium', class: 'text-blue-500', bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  high: { icon: ArrowUp, label: 'High', class: 'text-orange-500', bgClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  urgent: { icon: AlertTriangle, label: 'Urgent', class: 'text-destructive', bgClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadTask() {
      try {
        setIsLoading(true);
        const taskData = await getTask(taskId);
        setTask(taskData);
      } catch {
        setError('Task not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (taskId) loadTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateTask(task.id, {
        status: newStatus as 'open' | 'in_progress' | 'completed' | 'cancelled',
      });
      setTask(updated);
    } catch {}
    setUpdatingStatus(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(task.id);
      router.push('/tasks');
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Task not found</h1>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.open;
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Tasks
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task header */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                status.bgClass
              )}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                priority.bgClass
              )}>
                <PriorityIcon className="w-4 h-4" />
                {priority.label}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">{task.title}</h1>

            {task.description && (
              <MarkdownContent content={task.description} />
            )}

            {task.due_date && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Due: {new Date(task.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>

          {/* Status transition */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Update Status</h3>
            <div className="flex items-center gap-2">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {updatingStatus && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Task info */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Task Info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs text-foreground truncate">{task.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created by</dt>
                <dd className="text-foreground font-mono text-xs truncate">{task.created_by}</dd>
              </div>
              {task.assigned_to && (
                <div>
                  <dt className="text-muted-foreground">Assigned to</dt>
                  <dd className="text-foreground font-mono text-xs truncate">{task.assigned_to}</dd>
                </div>
              )}
              {task.channel_id && (
                <div>
                  <dt className="text-muted-foreground">Channel</dt>
                  <dd className="text-foreground font-mono text-xs truncate">{task.channel_id}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">{formatDateTime(task.created_at)}</dd>
              </div>
              {task.updated_at !== task.created_at && (
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="text-foreground">{formatDateTime(task.updated_at)}</dd>
                </div>
              )}
              {task.completed_at && (
                <div>
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd className="text-foreground">{formatDateTime(task.completed_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Danger zone */}
          <div className="bg-card rounded-lg border border-destructive/30 p-5">
            <h3 className="text-sm font-medium text-destructive mb-3">Danger Zone</h3>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors w-full justify-center"
            >
              <Trash2 className="w-4 h-4" />
              Delete Task
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
