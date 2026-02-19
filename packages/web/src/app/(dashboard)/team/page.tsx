'use client';

import { useState, useEffect } from 'react';
import { Agent, Task } from '@/types';
import { listAgents } from '@/lib/api/endpoints/agents';
import { listTasks } from '@/lib/api/endpoints/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  CheckCircle2,
  Clock,
  Circle,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const statusConfig = {
  open: { icon: Circle, label: 'Open', class: 'text-blue-500' },
  in_progress: { icon: Clock, label: 'In Progress', class: 'text-yellow-500' },
  completed: { icon: CheckCircle2, label: 'Completed', class: 'text-green-500' },
  cancelled: { icon: AlertCircle, label: 'Cancelled', class: 'text-muted-foreground' },
};

const priorityConfig = {
  low: { icon: ArrowDown, label: 'Low', class: 'text-muted-foreground' },
  medium: { icon: ArrowRight, label: 'Medium', class: 'text-blue-500' },
  high: { icon: ArrowUp, label: 'High', class: 'text-orange-500' },
  urgent: { icon: AlertTriangle, label: 'Urgent', class: 'text-destructive' },
};

const agentStatusConfig = {
  online: { class: 'bg-green-500', label: 'Online' },
  offline: { class: 'bg-gray-400', label: 'Offline' },
  busy: { class: 'bg-amber-500', label: 'Busy' },
};

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pipelineTasks, setPipelineTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load agents
      const { agents: agentsData } = await listAgents(1, 100);
      setAgents(agentsData);

      // Load pipeline tasks (open and in_progress)
      const [openTasks, inProgressTasks] = await Promise.all([
        listTasks({ status: 'open', page: 1, limit: 20 }),
        listTasks({ status: 'in_progress', page: 1, limit: 20 }),
      ]);
      setPipelineTasks([...openTasks.tasks, ...inProgressTasks.tasks]);

      // Load recently completed tasks
      const { tasks: completedData } = await listTasks({ status: 'completed', page: 1, limit: 10 });
      setCompletedTasks(completedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">Team roster and shared state</p>
        </div>

        {/* Skeleton loaders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = {
    totalAgents: agents.length,
    onlineAgents: agents.filter((a) => a.status === 'online').length,
    openTasks: pipelineTasks.filter((t) => t.status === 'open').length,
    inProgressTasks: pipelineTasks.filter((t) => t.status === 'in_progress').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground">Team roster and shared state</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalAgents}</div>
                <div className="text-xs text-muted-foreground">Total Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.onlineAgents}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-500">{stats.openTasks}</div>
                <div className="text-xs text-muted-foreground">Open Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-500">{stats.inProgressTasks}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Roster */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Roster
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No agents yet</p>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => {
                    const statusConfig = agentStatusConfig[agent.status as keyof typeof agentStatusConfig];
                    return (
                      <Link key={agent.id} href={`/agents/${agent.id}`}>
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div className={cn('absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card', statusConfig.class)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{statusConfig.label}</p>
                            {agent.capabilities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {agent.capabilities.slice(0, 2).map((cap) => (
                                  <Badge key={cap} variant="secondary" className="text-xs px-1.5 py-0">
                                    {cap}
                                  </Badge>
                                ))}
                                {agent.capabilities.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    +{agent.capabilities.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline & Completed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active tasks</p>
              ) : (
                <div className="space-y-2">
                  {pipelineTasks.slice(0, 10).map((task) => {
                    const status = statusConfig[task.status as keyof typeof statusConfig];
                    const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
                    const StatusIcon = status.icon;
                    const PriorityIcon = priority.icon;

                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <StatusIcon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', status.class)} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn('text-xs', status.class, 'border-current')}>
                                {status.label}
                              </Badge>
                              <PriorityIcon className={cn('w-3.5 h-3.5', priority.class)} />
                            </div>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Completed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Recently Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No completed tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {completedTasks.slice(0, 8).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground line-clamp-1 flex-1">{task.title}</p>
                        {task.completed_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
