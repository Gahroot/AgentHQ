import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionManager } from './subscriptions';

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;

  beforeEach(() => {
    manager = new SubscriptionManager();
  });

  describe('subscribe', () => {
    it('adds a client to a channel', () => {
      manager.subscribe('channel-1', 'client-1');
      const subs = manager.getSubscribers('channel-1');
      expect(subs.has('client-1')).toBe(true);
    });

    it('allows multiple clients on the same channel', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-1', 'client-2');
      const subs = manager.getSubscribers('channel-1');
      expect(subs.size).toBe(2);
      expect(subs.has('client-1')).toBe(true);
      expect(subs.has('client-2')).toBe(true);
    });

    it('allows a client to subscribe to multiple channels', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-2', 'client-1');
      expect(manager.getSubscribers('channel-1').has('client-1')).toBe(true);
      expect(manager.getSubscribers('channel-2').has('client-1')).toBe(true);
    });

    it('is idempotent for same client/channel pair', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-1', 'client-1');
      const subs = manager.getSubscribers('channel-1');
      expect(subs.size).toBe(1);
    });
  });

  describe('unsubscribe', () => {
    it('removes a client from a channel', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.unsubscribe('channel-1', 'client-1');
      const subs = manager.getSubscribers('channel-1');
      expect(subs.has('client-1')).toBe(false);
    });

    it('does not affect other clients on the same channel', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-1', 'client-2');
      manager.unsubscribe('channel-1', 'client-1');
      const subs = manager.getSubscribers('channel-1');
      expect(subs.has('client-2')).toBe(true);
      expect(subs.size).toBe(1);
    });

    it('handles unsubscribe from non-existent channel gracefully', () => {
      expect(() => manager.unsubscribe('nonexistent', 'client-1')).not.toThrow();
    });

    it('cleans up empty channel after last unsubscribe', () => {
      manager.subscribe('channel-1', 'client-1');
      expect(manager.getChannelCount()).toBe(1);
      manager.unsubscribe('channel-1', 'client-1');
      expect(manager.getChannelCount()).toBe(0);
    });
  });

  describe('unsubscribeAll', () => {
    it('removes all subscriptions for a client', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-2', 'client-1');
      manager.subscribe('channel-3', 'client-1');

      manager.unsubscribeAll('client-1');

      expect(manager.getSubscribers('channel-1').has('client-1')).toBe(false);
      expect(manager.getSubscribers('channel-2').has('client-1')).toBe(false);
      expect(manager.getSubscribers('channel-3').has('client-1')).toBe(false);
    });

    it('does not affect other clients', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-1', 'client-2');

      manager.unsubscribeAll('client-1');

      expect(manager.getSubscribers('channel-1').has('client-2')).toBe(true);
    });

    it('cleans up empty channels', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-2', 'client-1');

      manager.unsubscribeAll('client-1');

      expect(manager.getChannelCount()).toBe(0);
    });

    it('handles unsubscribeAll for unknown client gracefully', () => {
      manager.subscribe('channel-1', 'client-1');
      expect(() => manager.unsubscribeAll('unknown-client')).not.toThrow();
      expect(manager.getSubscribers('channel-1').size).toBe(1);
    });
  });

  describe('getSubscribers', () => {
    it('returns correct set of client IDs', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-1', 'client-2');

      const subs = manager.getSubscribers('channel-1');
      expect(subs).toBeInstanceOf(Set);
      expect(subs.size).toBe(2);
      expect(subs.has('client-1')).toBe(true);
      expect(subs.has('client-2')).toBe(true);
    });

    it('returns empty set for unknown channel', () => {
      const subs = manager.getSubscribers('nonexistent');
      expect(subs).toBeInstanceOf(Set);
      expect(subs.size).toBe(0);
    });
  });

  describe('getChannelCount', () => {
    it('returns 0 when no subscriptions exist', () => {
      expect(manager.getChannelCount()).toBe(0);
    });

    it('returns correct count', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-2', 'client-1');
      manager.subscribe('channel-3', 'client-2');
      expect(manager.getChannelCount()).toBe(3);
    });

    it('decreases when channels are emptied', () => {
      manager.subscribe('channel-1', 'client-1');
      manager.subscribe('channel-2', 'client-1');
      expect(manager.getChannelCount()).toBe(2);

      manager.unsubscribe('channel-1', 'client-1');
      expect(manager.getChannelCount()).toBe(1);
    });
  });
});
