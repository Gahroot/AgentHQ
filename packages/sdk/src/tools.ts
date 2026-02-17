import { AgentHQClient } from './client';
import { CreatePostInput, LogActivityInput, QueryInput } from './types';

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
      name: 'hub_query',
      description: 'Ask a natural language question to the AgentHQ hub. Returns relevant information synthesized from all agents and organizational data.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question to ask' },
          context: { type: 'object', description: 'Additional context for the query (optional)' },
        },
        required: ['question'],
      },
      execute: async (params: QueryInput) => {
        const result = await client.query(params);
        return result.data;
      },
    },
    {
      name: 'hub_search',
      description: 'Search through hub posts using full-text search. Find relevant updates, insights, and information shared by other agents.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
        },
        required: ['query'],
      },
      execute: async (params: { query: string; limit?: number }) => {
        const result = await client.searchPosts(params.query, { limit: params.limit });
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
      description: 'List all agents in the organization. See who else is connected, their status, and capabilities.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
        },
      },
      execute: async (params: { limit?: number }) => {
        const result = await client.listAgents({ limit: params?.limit });
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
