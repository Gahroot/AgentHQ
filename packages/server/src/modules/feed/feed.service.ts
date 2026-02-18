import { postService } from '../posts/post.service';
import { activityService } from '../activity/activity.service';
import { insightService } from '../insights/insight.service';

const VALID_TYPES = ['posts', 'activity', 'insights'] as const;
type FeedType = (typeof VALID_TYPES)[number];

export interface FeedItem {
  resource_type: string;
  resource_id: string;
  timestamp: string;
  summary: string;
  data: Record<string, any>;
}

export function parseFeedTypes(types?: string): FeedType[] {
  if (!types) return [...VALID_TYPES];
  const requested = types.split(',').map((t) => t.trim()) as FeedType[];
  return requested.filter((t) => VALID_TYPES.includes(t));
}

function buildSummary(type: string, item: Record<string, any>): string {
  switch (type) {
    case 'post':
      return item.title ? `New ${item.type || 'post'}: ${item.title}` : `New ${item.type || 'post'} by ${item.author_id}`;
    case 'activity':
      return `${item.action} by ${item.actor_id}`;
    case 'insight':
      return `New ${item.type || 'insight'}: ${item.title}`;
    default:
      return `New ${type}`;
  }
}

export const feedService = {
  async getFeed(
    orgId: string,
    filters: {
      since?: string;
      until?: string;
      types?: FeedType[];
      actor_id?: string;
    },
    limit: number,
    offset: number,
  ) {
    const types = filters.types || [...VALID_TYPES];
    const since = filters.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const until = filters.until;

    // Fetch a larger window from each source to allow for merged sorting + pagination
    const fetchLimit = limit + offset;
    const fetches: Promise<any>[] = [];
    const fetchOrder: FeedType[] = [];

    if (types.includes('posts')) {
      fetchOrder.push('posts');
      const postFilters: Record<string, string | undefined> = { since };
      if (filters.actor_id) postFilters.author_id = filters.actor_id;
      fetches.push(postService.listPosts(orgId, postFilters, fetchLimit, 0));
    }

    if (types.includes('activity')) {
      fetchOrder.push('activity');
      const activityFilters: Record<string, string | undefined> = { from: since };
      if (until) activityFilters.to = until;
      if (filters.actor_id) activityFilters.actor_id = filters.actor_id;
      fetches.push(activityService.queryActivity(orgId, activityFilters, fetchLimit, 0));
    }

    if (types.includes('insights')) {
      fetchOrder.push('insights');
      const insightFilters: Record<string, string | undefined> = { since };
      fetches.push(insightService.listInsights(orgId, insightFilters, fetchLimit, 0));
    }

    const results = await Promise.all(fetches);

    // Build unified feed items
    const items: FeedItem[] = [];
    let totalCount = 0;

    for (let i = 0; i < fetchOrder.length; i++) {
      const type = fetchOrder[i];
      const result = results[i];

      if (type === 'posts') {
        totalCount += result.total;
        for (const post of result.posts) {
          const ts = typeof post.created_at === 'string' ? post.created_at : post.created_at.toISOString();
          if (until && ts > until) continue;
          items.push({
            resource_type: 'post',
            resource_id: post.id,
            timestamp: ts,
            summary: buildSummary('post', post),
            data: post,
          });
        }
      } else if (type === 'activity') {
        totalCount += result.total;
        for (const entry of result.entries) {
          const ts = typeof entry.created_at === 'string' ? entry.created_at : entry.created_at.toISOString();
          items.push({
            resource_type: 'activity',
            resource_id: entry.id,
            timestamp: ts,
            summary: buildSummary('activity', entry),
            data: entry,
          });
        }
      } else if (type === 'insights') {
        totalCount += result.total;
        for (const insight of result.insights) {
          const ts = typeof insight.created_at === 'string' ? insight.created_at : insight.created_at.toISOString();
          if (until && ts > until) continue;
          items.push({
            resource_type: 'insight',
            resource_id: insight.id,
            timestamp: ts,
            summary: buildSummary('insight', insight),
            data: insight,
          });
        }
      }
    }

    // Sort by timestamp descending
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Apply pagination on merged results
    const paged = items.slice(offset, offset + limit);

    return {
      items: paged,
      total: totalCount,
      hasMore: offset + limit < totalCount,
    };
  },
};
