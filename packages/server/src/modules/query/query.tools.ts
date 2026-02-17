import Anthropic from '@anthropic-ai/sdk';
import { postService } from '../posts/post.service';
import { agentService } from '../agents/agent.service';
import { activityService } from '../activity/activity.service';
import { insightService } from '../insights/insight.service';
import { channelService } from '../channels/channel.service';
import { reService } from '../../verticals/real-estate/re.service';

export interface SourceRecord {
  id: string;
  type: string;
  title?: string;
  content?: string;
}

export interface ToolResult {
  data: unknown;
  sources: SourceRecord[];
}

const MAX_LIMIT = 50;

function clampLimit(limit?: number): number {
  const n = limit ?? 20;
  return Math.min(Math.max(1, n), MAX_LIMIT);
}

export const toolDefinitions: Anthropic.Messages.Tool[] = [
  {
    name: 'search_posts',
    description: 'Full-text search across posts in the hub. Returns posts matching the query string.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query string' },
        limit: { type: 'number', description: 'Max results to return (default 20, max 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_posts',
    description: 'List posts filtered by type, channel, or author. Returns posts in reverse chronological order.',
    input_schema: {
      type: 'object' as const,
      properties: {
        channel_id: { type: 'string', description: 'Filter by channel ID' },
        type: { type: 'string', description: 'Filter by post type (update, insight, question, alert)' },
        author_id: { type: 'string', description: 'Filter by author ID' },
        limit: { type: 'number', description: 'Max results to return (default 20, max 50)' },
      },
      required: [],
    },
  },
  {
    name: 'list_agents',
    description: 'List all agents in the organization with their status, capabilities, and metadata.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max results to return (default 20, max 50)' },
      },
      required: [],
    },
  },
  {
    name: 'get_agent',
    description: 'Get detailed information about a single agent by ID.',
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_id: { type: 'string', description: 'The agent ID to look up' },
      },
      required: ['agent_id'],
    },
  },
  {
    name: 'query_activity',
    description: 'Query the activity log with optional filters for actor, action, and time range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        actor_id: { type: 'string', description: 'Filter by actor ID' },
        action: { type: 'string', description: 'Filter by action type' },
        from: { type: 'string', description: 'Start of time range (ISO 8601)' },
        to: { type: 'string', description: 'End of time range (ISO 8601)' },
        limit: { type: 'number', description: 'Max results to return (default 20, max 50)' },
      },
      required: [],
    },
  },
  {
    name: 'list_insights',
    description: 'List insights by type (trend, performance, anomaly, recommendation).',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', description: 'Filter by insight type' },
        limit: { type: 'number', description: 'Max results to return (default 20, max 50)' },
      },
      required: [],
    },
  },
  {
    name: 'list_channels',
    description: 'List all channels in the organization.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 're_list_transactions',
    description: 'List real estate transactions filtered by status, type, or agent. Returns deals with property info and pricing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter by status (prospecting, active, pending, closed, cancelled)' },
        type: { type: 'string', description: 'Filter by type (listing, buyer)' },
        listing_agent_id: { type: 'string', description: 'Filter by listing agent ID' },
        buyers_agent_id: { type: 'string', description: 'Filter by buyers agent ID' },
        limit: { type: 'number', description: 'Max results to return (default 20, max 50)' },
      },
      required: [],
    },
  },
  {
    name: 're_get_metrics',
    description: 'Get real estate performance metrics: total volume, deal count, average price, etc. Can be filtered by agent and time period.',
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_id: { type: 'string', description: 'Filter metrics for a specific agent' },
        period: { type: 'string', description: 'Period grouping (daily, weekly, monthly)' },
        from: { type: 'string', description: 'Start date (ISO 8601)' },
        to: { type: 'string', description: 'End date (ISO 8601)' },
      },
      required: [],
    },
  },
  {
    name: 're_get_leaderboard',
    description: 'Get agent leaderboard ranked by total volume. Returns agents sorted from highest to lowest performance.',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', description: 'Period grouping: daily, weekly, or monthly (default: monthly)' },
        period_start: { type: 'string', description: 'Start of the period (ISO 8601 date). Defaults to start of current month.' },
      },
      required: [],
    },
  },
];

export async function executeTool(
  orgId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  switch (toolName) {
    case 'search_posts': {
      const limit = clampLimit(input.limit as number | undefined);
      const { posts } = await postService.searchPosts(orgId, input.query as string, limit, 0);
      return {
        data: posts,
        sources: posts.map((p: any) => ({
          id: p.id,
          type: 'post',
          title: p.title,
          content: typeof p.content === 'string' ? p.content.substring(0, 200) : undefined,
        })),
      };
    }

    case 'list_posts': {
      const limit = clampLimit(input.limit as number | undefined);
      const filters: { channel_id?: string; type?: string; author_id?: string } = {};
      if (input.channel_id) filters.channel_id = input.channel_id as string;
      if (input.type) filters.type = input.type as string;
      if (input.author_id) filters.author_id = input.author_id as string;
      const { posts } = await postService.listPosts(orgId, filters, limit, 0);
      return {
        data: posts,
        sources: posts.map((p: any) => ({
          id: p.id,
          type: 'post',
          title: p.title,
          content: typeof p.content === 'string' ? p.content.substring(0, 200) : undefined,
        })),
      };
    }

    case 'list_agents': {
      const limit = clampLimit(input.limit as number | undefined);
      const { agents } = await agentService.listAgents(orgId, limit, 0);
      return { data: agents, sources: [] };
    }

    case 'get_agent': {
      const agent = await agentService.getAgent(input.agent_id as string, orgId);
      return { data: agent ?? null, sources: [] };
    }

    case 'query_activity': {
      const limit = clampLimit(input.limit as number | undefined);
      const filters: { actor_id?: string; action?: string; from?: string; to?: string } = {};
      if (input.actor_id) filters.actor_id = input.actor_id as string;
      if (input.action) filters.action = input.action as string;
      if (input.from) filters.from = input.from as string;
      if (input.to) filters.to = input.to as string;
      const { entries } = await activityService.queryActivity(orgId, filters, limit, 0);
      return { data: entries, sources: [] };
    }

    case 'list_insights': {
      const limit = clampLimit(input.limit as number | undefined);
      const filters: { type?: string } = {};
      if (input.type) filters.type = input.type as string;
      const { insights } = await insightService.listInsights(orgId, filters, limit, 0);
      return {
        data: insights,
        sources: insights.map((i: any) => ({
          id: i.id,
          type: 'insight',
          title: i.title,
          content: typeof i.content === 'string' ? i.content.substring(0, 200) : undefined,
        })),
      };
    }

    case 'list_channels': {
      const channels = await channelService.listChannels(orgId);
      return { data: channels, sources: [] };
    }

    case 're_list_transactions': {
      const limit = clampLimit(input.limit as number | undefined);
      const filters: { status?: string; type?: string; listing_agent_id?: string; buyers_agent_id?: string } = {};
      if (input.status) filters.status = input.status as string;
      if (input.type) filters.type = input.type as string;
      if (input.listing_agent_id) filters.listing_agent_id = input.listing_agent_id as string;
      if (input.buyers_agent_id) filters.buyers_agent_id = input.buyers_agent_id as string;
      const { transactions } = await reService.listTransactions(orgId, filters, limit, 0);
      return { data: transactions, sources: [] };
    }

    case 're_get_metrics': {
      const filters: { agent_id?: string; period?: string; from?: string; to?: string } = {};
      if (input.agent_id) filters.agent_id = input.agent_id as string;
      if (input.period) filters.period = input.period as string;
      if (input.from) filters.from = input.from as string;
      if (input.to) filters.to = input.to as string;
      const metrics = await reService.getMetrics(orgId, filters);
      return { data: metrics, sources: [] };
    }

    case 're_get_leaderboard': {
      const period = (input.period as string) || 'monthly';
      const periodStart = (input.period_start as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const leaderboard = await reService.getLeaderboard(orgId, period, periodStart);
      return { data: leaderboard, sources: [] };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
