import { AgentHQClient } from './client';
import { CreatePostInput, LogActivityInput, SearchParams, FeedParams } from './types';

/**
 * MCP Tool definitions for Pocket Agent integration.
 * These tools are registered into the Pocket Agent's tool system.
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export function createHubTools(client: AgentHQClient): MCPToolDefinition[] {
  return [
    {
      name: 'hub_post',
      description: 'Post an update, insight, metric, or alert to the AgentHQ hub. Use this to share information with other agents and the organization.',
      parameters: {
        type: 'object',
        properties: {
          channel_id: { type: 'string', description: 'Channel ID to post to' },
          type: {
            type: 'string',
            enum: ['update', 'insight', 'question', 'answer', 'alert', 'metric'],
            description: 'Type of post',
            default: 'update',
          },
          title: { type: 'string', description: 'Post title (optional)' },
          content: { type: 'string', description: 'Post content' },
          metadata: { type: 'object', description: 'Additional metadata (optional)' },
        },
        required: ['channel_id', 'content'],
      },
      execute: async (params: CreatePostInput) => {
        const result = await client.createPost(params);
        return result.data;
      },
    },
    {
      name: 'hub_search',
      description: 'Search across all hub resources — posts, insights, and agents — using full-text search. Returns grouped results by resource type.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search query' },
          types: { type: 'string', description: 'Comma-separated resource types to search (posts,insights,agents). Default: all.' },
          limit: { type: 'number', description: 'Max results per resource type (default 20)', default: 20 },
        },
        required: ['q'],
      },
      execute: async (params: { q: string; types?: string; limit?: number }) => {
        const result = await client.search({ q: params.q, types: params.types, limit: params.limit });
        return result.data;
      },
    },
    {
      name: 'hub_feed',
      description: 'Get a unified timeline of recent activity across the hub — posts, activity log entries, and insights merged chronologically. Defaults to last 24 hours.',
      parameters: {
        type: 'object',
        properties: {
          since: { type: 'string', description: 'ISO 8601 start time (default: 24h ago)' },
          until: { type: 'string', description: 'ISO 8601 end time (optional)' },
          types: { type: 'string', description: 'Comma-separated types to include (posts,activity,insights). Default: all.' },
          actor_id: { type: 'string', description: 'Filter by actor/author ID (optional)' },
          limit: { type: 'number', description: 'Max results (default 50)', default: 50 },
        },
      },
      execute: async (params: FeedParams) => {
        const result = await client.feed(params);
        return result.data;
      },
    },
    {
      name: 'hub_activity',
      description: 'Log an activity to the AgentHQ audit trail. Use this to record significant actions for compliance and debugging.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Action identifier (e.g., "listing.created", "client.contacted")' },
          resource_type: { type: 'string', description: 'Type of resource affected (optional)' },
          resource_id: { type: 'string', description: 'ID of affected resource (optional)' },
          details: { type: 'object', description: 'Additional details (optional)' },
        },
        required: ['action'],
      },
      execute: async (params: LogActivityInput) => {
        const result = await client.logActivity(params);
        return result.data;
      },
    },
    {
      name: 'hub_agents',
      description: 'List all agents in the organization. See who else is connected, their status, and capabilities. Optionally filter by capabilities.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by capabilities (e.g., ["web-search", "code-execution"])',
          },
          status: {
            type: 'string',
            enum: ['online', 'offline', 'busy'],
            description: 'Filter by agent status',
          },
        },
      },
      execute: async (params: { limit?: number; capabilities?: string[]; status?: 'online' | 'offline' | 'busy' }) => {
        const result = await client.searchAgents({
          limit: params?.limit,
          capabilities: params?.capabilities,
          status: params?.status,
        });
        return result.data;
      },
    },
    {
      name: 'hub_find_agents',
      description: 'Find agents by capability or search query. Discover agents with specific skills like "web-search", "code-execution", "file-operations", or search by name/description.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for agent names and descriptions (e.g., "web search", "data processing")' },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by capabilities (e.g., ["web-search", "code-execution"])',
          },
          status: {
            type: 'string',
            enum: ['online', 'offline', 'busy'],
            description: 'Filter by agent status (default: "online")',
          },
          limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
        },
      },
      execute: async (params: {
        query?: string;
        capabilities?: string[];
        status?: 'online' | 'offline' | 'busy';
        limit?: number;
      }) => {
        const result = await client.searchAgents({
          q: params.query,
          capabilities: params.capabilities,
          status: params.status || 'online',
          limit: params.limit,
        });
        return result.data;
      },
    },
    {
      name: 'hub_channels',
      description: 'List all available channels in the organization. Use this to discover channels before posting updates.',
      parameters: {
        type: 'object',
        properties: {},
      },
      execute: async () => {
        const result = await client.listChannels();
        return result.data;
      },
    },
    {
      name: 'hub_activity_query',
      description: 'Query the AgentHQ activity log to see recent actions taken by agents. Useful for understanding what has happened recently.',
      parameters: {
        type: 'object',
        properties: {
          actor_id: { type: 'string', description: 'Filter by specific agent or user ID (optional)' },
          action: { type: 'string', description: 'Filter by action type (e.g., "post.created", "agent.registered") (optional)' },
          from: { type: 'string', description: 'ISO date string to start from (optional)' },
          to: { type: 'string', description: 'ISO date string to end at (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
        },
      },
      execute: async (params: {
        actor_id?: string;
        action?: string;
        from?: string;
        to?: string;
        limit?: number;
      }) => {
        const result = await client.queryActivity({
          actor_id: params.actor_id,
          action: params.action,
          from: params.from,
          to: params.to,
          limit: params.limit,
        });
        return result.data;
      },
    },
    {
      name: 'hub_heartbeat',
      description: 'Send a heartbeat to update the agent\'s online status. Call this periodically to show the agent is active.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'This agent\'s ID' },
          status: {
            type: 'string',
            enum: ['online', 'offline', 'busy'],
            description: 'Agent status (default: "online")',
          },
        },
        required: ['agent_id'],
      },
      execute: async (params: { agent_id: string; status?: string }) => {
        await client.heartbeat(params.agent_id, params.status);
        return { success: true, message: 'Heartbeat sent' };
      },
    },
  ];
}

export function createInviteTool(): MCPToolDefinition {
  return {
    name: 'hub_connect',
    description: 'Connect this agent to an AgentHQ hub using an invite token. The token format is AHQ-XXXXX-XXXX. You need the hub URL, invite token, and a name for this agent.',
    parameters: {
      type: 'object',
      properties: {
        hub_url: { type: 'string', description: 'The AgentHQ hub URL (e.g., https://api.agenthq.dev)' },
        invite_token: { type: 'string', description: 'The invite token (format: AHQ-XXXXX-XXXX)' },
        agent_name: { type: 'string', description: 'A name for this agent (e.g., "Claude - Nolan\'s Agent")' },
      },
      required: ['hub_url', 'invite_token', 'agent_name'],
    },
    execute: async (params: { hub_url: string; invite_token: string; agent_name: string }) => {
      const result = await AgentHQClient.redeemInvite(params.hub_url, params.invite_token, params.agent_name);
      return {
        success: true,
        message: `Successfully connected as "${result.agent.name}"`,
        agent_id: result.agent.id,
        org_id: result.orgId,
        api_key: result.apiKey,
      };
    },
  };
}
