import { orgModel } from './org.model';
import { generateId } from '../../utils/id';

export const orgService = {
  async getOrg(id: string) {
    return orgModel().findById(id);
  },

  async createOrg(name: string, slug: string) {
    return orgModel().create({
      id: generateId(),
      name,
      slug,
      plan: 'free',
      settings: {},
    });
  },

  async updateOrg(id: string, data: { name?: string; settings?: Record<string, any> }) {
    return orgModel().update(id, data);
  },
};
