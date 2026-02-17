'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Agent, ActivityEntry, Post } from '@/types';
import { getAgent } from '@/lib/api/endpoints/agents';
import { getActivityByActor } from '@/lib/api/endpoints/activity';
import { listPosts } from '@/lib/api/endpoints/posts';
import { getMetrics, REMetrics } from '@/lib/api/endpoints/re';
import { calculateAgentHealth } from '@/lib/utils/agent-health';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { HealthScore } from '@/components/agents/health-badge';
import {
  ArrowLeft,
  Activity,
  FileText,
  TrendingUp,
  Calendar,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState<REMetrics[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate health stats
  const recentActivityCount = activity.filter((a) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(a.created_at) >= sevenDaysAgo;
  }).length;

  const uniqueActiveDays = new Set(
    activity
      .filter((a) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(a.created_at) >= sevenDaysAgo;
      })
      .map((a) => new Date(a.created_at).toDateString())
  ).size;

  const health = agent
    ? calculateAgentHealth(agent, recentActivityCount, uniqueActiveDays)
    : null;

  const loadAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAgent(agentId);
      setAgent(data);

      // Load activity
      try {
        const { activity: activityData } = await getActivityByActor(agentId, 'agent', 1, 50);
        setActivity(activityData);
      } catch (err) {
        console.error('Failed to load activity:', err);
      }

      // Load posts
      try {
        const { posts: postsData } = await listPosts({ author_id: agentId }, 1, 20);
        setPosts(postsData);
      } catch (err) {
        console.error('Failed to load posts:', err);
      }

      // Load metrics
      try {
        const metricsData = await getMetrics({ agent_id: agentId });
        setMetrics(metricsData);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId, loadAgent]);

  const statusConfig = {
    online: { label: 'Online', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    offline: { label: 'Offline', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    busy: { label: 'Busy', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/agents" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Agents
        </Link>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{error || 'Agent not found'}</p>
        <Link href="/agents">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[agent.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/agents"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Agents
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <Badge className={status.className} variant="outline">{status.label}</Badge>
          </div>
          {agent.description && (
            <p className="text-muted-foreground">{agent.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadAgent}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Health score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {health && <HealthScore score={health.score} status={health.status} size="sm" />}
              <div>
                <div className="text-sm font-medium capitalize">{health?.status}</div>
                <div className="text-xs text-muted-foreground">
                  {recentActivityCount} activities this week
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  agent.status === 'online'
                    ? 'bg-green-500 animate-pulse'
                    : agent.status === 'busy'
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                )}
              />
              <span className="capitalize">{agent.status}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last seen {agent.last_heartbeat ? formatRelativeTime(agent.last_heartbeat) : 'Never'}
            </div>
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity.length}</div>
            <div className="text-xs text-muted-foreground">Total logged</div>
          </CardContent>
        </Card>

        {/* Posts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
            <div className="text-xs text-muted-foreground">Contributions</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">
            Activity
            {activity.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activity.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts
            {posts.length > 0 && (
              <Badge variant="secondary" className="ml-2">{posts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
                <CardDescription>Information about this agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Agent ID</div>
                    <div className="font-mono text-xs">{agent.id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">API Key Prefix</div>
                    <div className="font-mono text-xs">{agent.api_key_prefix}***</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div>{formatDateTime(agent.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Updated</div>
                    <div>{formatDateTime(agent.updated_at)}</div>
                  </div>
                </div>

                {agent.last_heartbeat && (
                  <div>
                    <div className="text-muted-foreground text-sm">Last Heartbeat</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(agent.last_heartbeat)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>Skills and features this agent provides</CardDescription>
              </CardHeader>
              <CardContent>
                {agent.capabilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {cap}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No capabilities defined</p>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            {Object.keys(agent.metadata).length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                  <CardDescription>Additional information stored with this agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(agent.metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-mono text-xs">
                          {typeof value === 'object'
                            ? JSON.stringify(value, null, 2)
                            : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Health breakdown */}
          {health && (
            <Card>
              <CardHeader>
                <CardTitle>Health Breakdown</CardTitle>
                <CardDescription>Detailed health metrics for this agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Heartbeat</span>
                      <span className="text-sm text-muted-foreground">{health.factors.heartbeat}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${health.factors.heartbeat}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Activity</span>
                      <span className="text-sm text-muted-foreground">{health.factors.activity}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${health.factors.activity}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Consistency</span>
                      <span className="text-sm text-muted-foreground">{health.factors.consistency}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${health.factors.consistency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="space-y-4">
          {activity.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                <p className="text-muted-foreground">This agent hasn&apos;t logged any activity.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activity.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {entry.action}
                          </Badge>
                          {entry.resource_type && (
                            <span className="text-xs text-muted-foreground">
                              {entry.resource_type}
                              {entry.resource_id && <span className="ml-1">#{entry.resource_id.slice(0, 8)}</span>}
                            </span>
                          )}
                        </div>
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {Object.entries(entry.details).map(([k, v]) => (
                              <span key={k} className="mr-3">
                                <span className="font-medium">{k}:</span> {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(entry.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Posts tab */}
        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">This agent hasn&apos;t created any posts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {post.title && (
                            <CardTitle className="text-base truncate">{post.title}</CardTitle>
                          )}
                          <CardDescription className="line-clamp-2 mt-1">
                            {post.content}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{post.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(post.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Performance tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real Estate Performance</CardTitle>
              <CardDescription>Metrics for this agent in the Real Estate vertical</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No performance data</h3>
                  <p className="text-muted-foreground text-center">
                    This agent doesn&apos;t have any Real Estate metrics recorded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                      <div className="text-2xl font-bold">
                        ${metrics.reduce((sum, m) => sum + (m.metrics.total_volume || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Closed Deals</div>
                      <div className="text-2xl font-bold">
                        {metrics.reduce((sum, m) => sum + (m.metrics.closed_deals || 0), 0)}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Avg Days to Close</div>
                      <div className="text-2xl font-bold">
                        {Math.round(
                          metrics.reduce((sum, m) => sum + (m.metrics.avg_days_to_close || 0), 0) /
                            metrics.length || 0
                        )}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      <div className="text-2xl font-bold">
                        {Math.round(
                          metrics.reduce((sum, m) => sum + (m.metrics.conversion_rate || 0), 0) /
                            metrics.length * 100 || 0
                        )}%
                      </div>
                    </div>
                  </div>

                  {/* Metrics by period */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Metrics by Period</h3>
                    {metrics.map((metric) => (
                      <Card key={metric.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{metric.period}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(metric.period_start)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Volume: </span>
                              <span className="font-medium">
                                ${(metric.metrics.total_volume || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Units: </span>
                              <span className="font-medium">{metric.metrics.total_units || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Closed: </span>
                              <span className="font-medium">{metric.metrics.closed_deals || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Days: </span>
                              <span className="font-medium">{metric.metrics.avg_days_to_close || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
