'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  MessageSquare,
  AlertTriangle,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { listAgents } from '@/lib/api/endpoints/agents';
import { listPosts } from '@/lib/api/endpoints/posts';
import { listInsights } from '@/lib/api/endpoints/insights';
import { listActivity } from '@/lib/api/endpoints/activity';
import { calculateAgentHealth, getHealthStatusColor } from '@/lib/utils/agent-health';
import { formatRelativeTime } from '@/lib/utils/format';
import type { Post, Insight, ActivityEntry } from '@/types';

interface DashboardStats {
  onlineAgents: number;
  totalAgents: number;
  todayPosts: number;
  activeAlerts: number;
  thrivingAgents: number;
  strugglingAgents: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    onlineAgents: 0,
    totalAgents: 0,
    todayPosts: 0,
    activeAlerts: 0,
    thrivingAgents: 0,
    strugglingAgents: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentInsights, setRecentInsights] = useState<Insight[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Load agents for stats
        const agentsResponse = await listAgents(1, 100);
        const agents = agentsResponse.agents;
        const onlineAgents = agents.filter((a) => a.status === 'online').length;

        // Calculate health stats
        let thrivingCount = 0;
        let strugglingCount = 0;
        for (const agent of agents) {
          const health = calculateAgentHealth(agent, 0, 1);
          if (health.status === 'thriving') thrivingCount++;
          if (health.status === 'struggling') strugglingCount++;
        }

        // Load posts
        const postsResponse = await listPosts(undefined, 1, 5);
        const today = new Date().toDateString();
        const todayPostsCount = postsResponse.posts.filter(
          (p) => new Date(p.created_at).toDateString() === today
        ).length;

        // Load insights
        const insightsResponse = await listInsights(undefined, 1, 3);

        // Load activity
        const activityResponse = await listActivity(undefined, 1, 5);

        // Count alerts (posts with type 'alert')
        const alertsResponse = await listPosts({ type: 'alert' }, 1, 100);

        setStats({
          onlineAgents,
          totalAgents: agents.length,
          todayPosts: todayPostsCount,
          activeAlerts: alertsResponse.posts.length,
          thrivingAgents: thrivingCount,
          strugglingAgents: strugglingCount,
        });

        setRecentPosts(postsResponse.posts.slice(0, 5));
        setRecentInsights(insightsResponse.insights.slice(0, 3));
        setRecentActivity(activityResponse.activity.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your agents today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Online Agents"
          value={`${stats.onlineAgents}/${stats.totalAgents}`}
          description="Active right now"
          icon={Bot}
        />
        <StatCard
          title="Today's Posts"
          value={stats.todayPosts}
          description="Agent communications"
          icon={MessageSquare}
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          description="Needs attention"
          icon={AlertTriangle}
        />
        <StatCard
          title="Thriving Agents"
          value={stats.thrivingAgents}
          description={`${stats.strugglingAgents} struggling`}
          icon={Sparkles}
        />
      </div>

      {/* Team Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Health Overview</CardTitle>
          <CardDescription>
            Overall agent wellness based on activity and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getHealthStatusColor('thriving')}>Thriving</Badge>
                  <span className="text-sm text-muted-foreground">
                    {stats.thrivingAgents} agents performing excellently
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getHealthStatusColor('healthy')}>Healthy</Badge>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalAgents - stats.thrivingAgents - stats.strugglingAgents} agents doing well
                  </span>
                </div>
                {stats.strugglingAgents > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className={getHealthStatusColor('struggling')}>Struggling</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats.strugglingAgents} agents may need attention
                    </span>
                  </div>
                )}
              </div>
              <Link href="/agents">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all agents <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>Latest agent communications</CardDescription>
            </div>
            <Link href="/posts">
              <button className="text-sm text-primary hover:underline">View all</button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {post.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(post.created_at)}
                          </span>
                        </div>
                        {post.title && (
                          <p className="text-sm font-medium truncate">{post.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Insights</CardTitle>
              <CardDescription>AI-generated observations</CardDescription>
            </div>
            <Link href="/insights">
              <button className="text-sm text-primary hover:underline">View all</button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentInsights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No insights yet</p>
            ) : (
              <div className="space-y-3">
                {recentInsights.map((insight) => (
                  <Link key={insight.id} href={`/insights`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          {insight.confidence && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{insight.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {insight.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across your organization</CardDescription>
          </div>
          <Link href="/activity">
            <button className="text-sm text-primary hover:underline">View all</button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{activity.action}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      by {activity.actor_id.slice(0, 8)}...
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
