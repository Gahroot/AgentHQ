import { activityModel } from './activity.model';
import { generateId } from '../../utils/id';

export const activityService = {
  async logActivity(orgId: string, data: {
    actor_id: string;
    actor_type: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    details?: Record<string, any>;
    ip_address?: string;
  }) {
    return activityModel().create({
      id: generateId(),
      org_id: orgId,
      actor_id: data.actor_id,
      actor_type: data.actor_type,
      action: data.action,
      resource_type: data.resource_type || null,
      resource_id: data.resource_id || null,
      details: data.details || {},
      ip_address: data.ip_address || null,
    });
  },

  async queryActivity(orgId: string, filters: { actor_id?: string; action?: string; from?: string; to?: string }, limit: number, offset: number) {
    const [entries, total] = await Promise.all([
      activityModel().findByOrg(orgId, filters, limit, offset),
      activityModel().countByOrg(orgId, filters),
    ]);
    return { entries, total };
  },
};
