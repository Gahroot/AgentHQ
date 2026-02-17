import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindById = vi.fn();
const mockUpdate = vi.fn();

vi.mock('./org.model', () => ({
  orgModel: vi.fn(() => ({
    create: mockCreate,
    findById: mockFindById,
    update: mockUpdate,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-ulid-001'),
}));

import { orgService } from './org.service';

describe('orgService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrg', () => {
    it('calls model.create with correct defaults', async () => {
      const mockOrg = { id: 'mock-ulid-001', name: 'Acme', slug: 'acme', plan: 'free', settings: {} };
      mockCreate.mockResolvedValue(mockOrg);

      const result = await orgService.createOrg('Acme', 'acme');

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-ulid-001',
        name: 'Acme',
        slug: 'acme',
        plan: 'free',
        settings: {},
      });
      expect(result).toEqual(mockOrg);
    });
  });

  describe('getOrg', () => {
    it('calls model.findById with the given id', async () => {
      const mockOrg = { id: 'org-1', name: 'Test Org' };
      mockFindById.mockResolvedValue(mockOrg);

      const result = await orgService.getOrg('org-1');

      expect(mockFindById).toHaveBeenCalledWith('org-1');
      expect(result).toEqual(mockOrg);
    });

    it('returns undefined when org not found', async () => {
      mockFindById.mockResolvedValue(undefined);

      const result = await orgService.getOrg('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('updateOrg', () => {
    it('calls model.update with correct arguments', async () => {
      const updatedOrg = { id: 'org-1', name: 'Updated' };
      mockUpdate.mockResolvedValue(updatedOrg);

      const result = await orgService.updateOrg('org-1', { name: 'Updated' });

      expect(mockUpdate).toHaveBeenCalledWith('org-1', { name: 'Updated' });
      expect(result).toEqual(updatedOrg);
    });

    it('passes settings to model.update', async () => {
      const settings = { theme: 'dark' };
      mockUpdate.mockResolvedValue({ id: 'org-1', settings });

      await orgService.updateOrg('org-1', { settings });

      expect(mockUpdate).toHaveBeenCalledWith('org-1', { settings });
    });
  });
});
