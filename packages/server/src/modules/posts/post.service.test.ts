import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindByOrg = vi.fn();
const mockCountByOrg = vi.fn();
const mockFindById = vi.fn();
const mockSearch = vi.fn();
const mockSearchCount = vi.fn();

vi.mock('./post.model', () => ({
  postModel: vi.fn(() => ({
    create: mockCreate,
    findByOrg: mockFindByOrg,
    countByOrg: mockCountByOrg,
    findById: mockFindById,
    search: mockSearch,
    searchCount: mockSearchCount,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-post-id'),
}));

import { postService } from './post.service';

describe('postService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPost', () => {
    it('generates ID and sets defaults (type=update, pinned=false, metadata={})', async () => {
      const mockPost = { id: 'mock-post-id', content: 'Hello world' };
      mockCreate.mockResolvedValue(mockPost);

      const result = await postService.createPost('org-1', {
        channel_id: 'ch-1',
        author_id: 'user-1',
        author_type: 'user',
        content: 'Hello world',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-post-id',
        org_id: 'org-1',
        channel_id: 'ch-1',
        author_id: 'user-1',
        author_type: 'user',
        type: 'update',
        title: null,
        content: 'Hello world',
        metadata: {},
        parent_id: null,
        pinned: false,
      });
      expect(result).toEqual(mockPost);
    });

    it('uses provided type, title, metadata, and parent_id', async () => {
      mockCreate.mockResolvedValue({});

      await postService.createPost('org-1', {
        channel_id: 'ch-1',
        author_id: 'agent-1',
        author_type: 'agent',
        type: 'insight',
        title: 'My Insight',
        content: 'Some content',
        metadata: { key: 'value' },
        parent_id: 'post-parent',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'insight',
          title: 'My Insight',
          metadata: { key: 'value' },
          parent_id: 'post-parent',
        })
      );
    });
  });

  describe('listPosts', () => {
    it('delegates with correct filters, limit, and offset', async () => {
      const posts = [{ id: 'p1' }, { id: 'p2' }];
      mockFindByOrg.mockResolvedValue(posts);
      mockCountByOrg.mockResolvedValue(2);

      const filters = { channel_id: 'ch-1', type: 'update' };
      const result = await postService.listPosts('org-1', filters, 10, 0);

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1', filters, 10, 0);
      expect(mockCountByOrg).toHaveBeenCalledWith('org-1', filters);
      expect(result).toEqual({ posts, total: 2 });
    });

    it('handles empty results', async () => {
      mockFindByOrg.mockResolvedValue([]);
      mockCountByOrg.mockResolvedValue(0);

      const result = await postService.listPosts('org-1', {}, 20, 0);

      expect(result).toEqual({ posts: [], total: 0 });
    });
  });

  describe('searchPosts', () => {
    it('delegates to model.search and model.searchCount', async () => {
      const posts = [{ id: 'p1', content: 'matching post' }];
      mockSearch.mockResolvedValue(posts);
      mockSearchCount.mockResolvedValue(1);

      const result = await postService.searchPosts('org-1', 'matching', 10, 0);

      expect(mockSearch).toHaveBeenCalledWith('org-1', 'matching', 10, 0);
      expect(mockSearchCount).toHaveBeenCalledWith('org-1', 'matching');
      expect(result).toEqual({ posts, total: 1 });
    });
  });
});
