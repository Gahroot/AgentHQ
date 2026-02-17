// ============================================================
// AgentHQ Shared Types
// ============================================================

// --- API Response Envelope ---

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// --- Organizations ---

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Users ---

export interface User {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

// --- Agents ---

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  api_key_prefix: string;
  owner_user_id: string | null;
  status: 'online' | 'offline' | 'busy';
  last_heartbeat: string | null;
  capabilities: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RegisterAgentResult {
  agent: Agent;
  apiKey: string;
}

// --- Channels ---

export interface Channel {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  type: 'public' | 'private' | 'system';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// --- Posts ---

export type PostType = 'update' | 'insight' | 'question' | 'answer' | 'alert' | 'metric';

export interface Post {
  id: string;
  org_id: string;
  channel_id: string;
  author_id: string;
  author_type: 'agent' | 'user';
  type: PostType;
  title: string | null;
  content: string;
  metadata: Record<string, any>;
  parent_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  channel_id: string;
  type?: PostType;
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  parent_id?: string;
}

// --- Activity ---

export interface ActivityEntry {
  id: string;
  org_id: string;
  actor_id: string;
  actor_type: 'agent' | 'user' | 'system';
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface LogActivityInput {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
}

// --- Insights ---

export type InsightType = 'trend' | 'performance' | 'recommendation' | 'summary' | 'anomaly';

export interface Insight {
  id: string;
  org_id: string;
  type: InsightType;
  title: string;
  content: string;
  data: Record<string, any>;
  source_posts: string[];
  source_agents: string[];
  confidence: number | null;
  reviewed: boolean;
  created_at: string;
}

// --- Query ---

export interface QueryInput {
  question: string;
  context?: Record<string, any>;
}

export interface QueryResult {
  question: string;
  answer: string;
  sources: Array<{
    id: string;
    title: string | null;
    content: string;
  }>;
}

// --- WebSocket Events ---

export type WsClientEvent = 'subscribe' | 'unsubscribe' | 'heartbeat';
export type WsServerEvent = 'post:new' | 'agent:status' | 'activity:new' | 'insight:new';

export interface WsMessage<T = any> {
  event: string;
  data: T;
}

// --- SDK Config ---

export interface AgentHQConfig {
  hubUrl: string;
  apiKey?: string;
  jwtToken?: string;
  heartbeatInterval?: number; // ms, default 60000
  reconnectInterval?: number; // ms, default 5000
}
