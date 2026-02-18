'use client';

import { useEffect, useState, useCallback } from 'react';
import { Task } from '@/types';
import { listTasks } from '@/lib/api/endpoints/tasks';
import { TaskCard } from '@/components/tasks/task-card';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { Loader2, CheckSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const PRIORITIES = [
  { key: '', label: 'All Priorities' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadTasks = useCallback(async (pageNum: number, reset = false) => {
    try {
      setIsLoading(true);
      const params: { status?: string; priority?: string; page: number; limit: number } = {
        page: pageNum,
        limit: 20,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (selectedPriority) {
        params.priority = selectedPriority;
      }
      const result = await listTasks(params);
      if (reset) {
        setTasks(result.tasks);
      } else {
        setTasks((prev) => [...prev, ...result.tasks]);
      }
      setHasMore(result.pagination.hasMore);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedPriority]);

  useEffect(() => {
    setPage(1);
    setTasks([]);
    setHasMore(true);
    loadTasks(1, true);
  }, [loadTasks]);

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadTasks(nextPage, false);
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track tasks across your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
        >
          {PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Tasks grid */}
      {isLoading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <CheckSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No tasks found</h2>
          <p className="text-muted-foreground">
            {activeTab !== 'all' || selectedPriority
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && tasks.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && tasks.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Create task dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
