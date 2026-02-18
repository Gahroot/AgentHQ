import { postService } from '../posts/post.service';
import { insightService } from '../insights/insight.service';
import { agentService } from '../agents/agent.service';

const VALID_TYPES = ['posts', 'insights', 'agents'] as const;
type SearchType = (typeof VALID_TYPES)[number];

export function parseSearchTypes(types?: string): SearchType[] {
  if (!types) return [...VALID_TYPES];
  const requested = types.split(',').map((t) => t.trim()) as SearchType[];
  return requested.filter((t) => VALID_TYPES.includes(t));
}

export const searchService = {
  async search(
    orgId: string,
    query: string,
    types: SearchType[],
    limit: number,
    offset: number,
  ) {
    const searches: Promise<any>[] = [];
    const typeOrder: SearchType[] = [];

    if (types.includes('posts')) {
      typeOrder.push('posts');
      searches.push(postService.searchPosts(orgId, query, limit, offset));
    }
    if (types.includes('insights')) {
      typeOrder.push('insights');
      searches.push(insightService.searchInsights(orgId, query, limit, offset));
    }
    if (types.includes('agents')) {
      typeOrder.push('agents');
      searches.push(agentService.searchAgents(orgId, query, {}, limit, offset));
    }

    const results = await Promise.all(searches);

    const data: Record<string, any[]> = { posts: [], insights: [], agents: [] };
    const counts: Record<string, number> = { posts: 0, insights: 0, agents: 0 };

    for (let i = 0; i < typeOrder.length; i++) {
      const type = typeOrder[i];
      const result = results[i];
      if (type === 'posts') {
        data.posts = result.posts;
        counts.posts = result.total;
      } else if (type === 'insights') {
        data.insights = result.insights;
        counts.insights = result.total;
      } else if (type === 'agents') {
        data.agents = result.agents;
        counts.agents = result.total;
      }
    }

    const total = counts.posts + counts.insights + counts.agents;

    return { data, counts, total };
  },
};
