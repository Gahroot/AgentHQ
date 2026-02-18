'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock, XCircle, ArrowUp, ArrowRight, ArrowDown, AlertTriangle, Calendar } from 'lucide-react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig = {
  open: { icon: Circle, label: 'Open', class: 'text-blue-500' },
  in_progress: { icon: Clock, label: 'In Progress', class: 'text-yellow-500' },
  completed: { icon: CheckCircle2, label: 'Completed', class: 'text-green-500' },
  cancelled: { icon: XCircle, label: 'Cancelled', class: 'text-muted-foreground' },
};

const priorityConfig = {
  low: { icon: ArrowDown, label: 'Low', class: 'text-muted-foreground' },
  medium: { icon: ArrowRight, label: 'Medium', class: 'text-blue-500' },
  high: { icon: ArrowUp, label: 'High', class: 'text-orange-500' },
  urgent: { icon: AlertTriangle, label: 'Urgent', class: 'text-destructive' },
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.open;
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;

  return (
    <Link href={`/tasks/${task.id}`}>
      <article className="bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <StatusIcon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', status.class)} />
            <div className="min-w-0">
              <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>
          <div className={cn('flex-shrink-0', priority.class)}>
            <PriorityIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full', status.class, 'bg-current/10')}>
            <span className="text-current">{status.label}</span>
          </span>
          {task.assigned_to && (
            <span className="truncate">Assigned</span>
          )}
          {task.due_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
