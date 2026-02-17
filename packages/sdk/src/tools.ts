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
  ];
}
