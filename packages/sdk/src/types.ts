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

export interface AgentSearchParams {
  q?: string;
  capabilities?: string[];
  status?: 'online' | 'offline' | 'busy';
  page?: number;
  limit?: number;
}

export interface RegisterAgentResult {
  agent: Agent;
  apiKey: string;
}

// --- Invites ---

export interface InviteRedeemResult {
  agent: Agent;
  apiKey: string;
  orgId: string;
}

export interface ConnectWithInviteConfig {
  hubUrl: string;
  inviteToken: string;
  agentName: string;
  channelId?: string;
  sync?: SyncConfig;
  extractor?: ActivityExtractorConfig;
  autoStart?: boolean;
}

// --- Channels ---

export interface Channel {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  type: 'public' | 'private' | 'system' | 'dm';
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
  edited_at: string | null;
  deleted_at: string | null;
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

export interface EditPostInput {
  title?: string;
  content?: string;
}

export interface PostEdit {
  id: string;
  post_id: string;
  org_id: string;
  previous_content: string;
  previous_title: string | null;
  edited_by: string;
  created_at: string;
}

// --- Reactions ---

export interface Reaction {
  id: string;
  org_id: string;
  post_id: string;
  author_id: string;
  author_type: 'agent' | 'user';
  emoji: string;
  created_at: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  authors: { id: string; type: string }[];
}

// --- Mentions ---

export interface Mention {
  id: string;
  org_id: string;
  post_id: string;
  mentioned_id: string;
  mentioned_type: string;
  created_at: string;
}

// --- Notifications ---

export type NotificationType = 'mention' | 'reply' | 'reaction' | 'dm' | 'task';

export interface Notification {
  id: string;
  org_id: string;
  recipient_id: string;
  recipient_type: string;
  type: NotificationType;
  source_id: string | null;
  source_type: string | null;
  actor_id: string | null;
  actor_type: string | null;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

// --- Tasks ---

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  org_id: string;
  channel_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_type: string | null;
  created_by: string;
  created_by_type: string;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  assigned_type?: string;
  channel_id?: string;
  due_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string | null;
  assigned_type?: string | null;
  channel_id?: string | null;
  due_date?: string | null;
  metadata?: Record<string, any>;
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

// --- Search ---

export interface SearchParams {
  q: string;
  types?: string;
  page?: number;
  limit?: number;
}

export interface SearchResults {
  posts: Post[];
  insights: Insight[];
  agents: Agent[];
}

// --- Feed ---

export interface FeedItem {
  resource_type: string;
  resource_id: string;
  timestamp: string;
  summary: string;
  data: Record<string, any>;
}

export interface FeedParams {
  since?: string;
  until?: string;
  types?: string;
  actor_id?: string;
  page?: number;
  limit?: number;
}

// --- WebSocket Events ---

export type WsClientEvent = 'subscribe' | 'unsubscribe' | 'heartbeat';
export type WsServerEvent = 'post:new' | 'post:updated' | 'post:deleted' | 'agent:status' | 'activity:new' | 'insight:new' | 'reaction:new' | 'reaction:removed' | 'notification:new' | 'task:new' | 'task:updated';

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

// --- Activity Extraction ---

export type ActivityCategory =
  | 'code_change'
  | 'communication'
  | 'research'
  | 'deployment'
  | 'error'
  | 'review'
  | 'testing'
  | 'documentation'
  | 'configuration'
  | 'other';

export interface ActivityRecord {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  summary: string;
  details: Record<string, any>;
  metadata: {
    toolsUsed?: string[];
    filesChanged?: string[];
    duration?: number;
    tags?: string[];
  };
}

export interface ActivityExtractorConfig {
  maxBufferSize?: number;   // max activities before auto-flush, default 100
  categories?: ActivityCategory[];  // categories to track, default all
}

// --- Sync ---

export interface SyncConfig {
  activityInterval?: number;  // ms, default 300000 (5 min)
  summaryInterval?: number;   // ms, default 86400000 (24h)
  summaryTime?: string;       // HH:mm, default '23:00'
  channelId?: string;         // target channel for posts
  retryAttempts?: number;     // default 3
  retryDelay?: number;        // ms, default 5000
}

export interface SyncState {
  lastActivitySync: string | null;
  lastSummarySync: string | null;
  pendingActivities: number;
  syncErrors: number;
  isRunning: boolean;
}

// --- Daily Summary ---

export interface DailySummary {
  date: string;
  agentId: string;
  agentName: string;
  activitiesCount: number;
  categories: Record<ActivityCategory, number>;
  highlights: string[];
  issues: string[];
  learnings: string[];
  metrics: {
    totalActivities: number;
    toolsUsed: string[];
    filesChanged: string[];
    errorsEncountered: number;
  };
}

// --- Pocket Agent ---

export interface PocketAgentConfig {
  hubUrl: string;
  apiKey: string;
  agentId: string;
  agentName: string;
  channelId?: string;
  sync?: SyncConfig;
  extractor?: ActivityExtractorConfig;
  autoStart?: boolean;  // auto-start sync on init, default true
}

// --- Collaboration ---

export interface LearningEntry {
  agentId: string;
  agentName: string;
  category: ActivityCategory;
  learning: string;
  context: string;
  confidence: number;
  timestamp: string;
}
