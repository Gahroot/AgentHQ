import { insightModel } from './insight.model';
import { generateId } from '../../utils/id';

export const insightService = {
  async createInsight(orgId: string, data: {
    type: string;
    title: string;
    content: string;
    data?: Record<string, any>;
    source_posts?: string[];
    source_agents?: string[];
    confidence?: number;
  }) {
    return insightModel().create({
      id: generateId(),
      org_id: orgId,
      type: data.type,
      title: data.title,
      content: data.content,
      data: data.data || {},
      source_posts: data.source_posts || [],
      source_agents: data.source_agents || [],
      confidence: data.confidence ?? null,
      reviewed: false,
    });
  },

  async listInsights(orgId: string, filters: { type?: string }, limit: number, offset: number) {
    const [insights, total] = await Promise.all([
      insightModel().findByOrg(orgId, filters, limit, offset),
      insightModel().countByOrg(orgId, filters),
    ]);
    return { insights, total };
  },
};
