/**
 * Subscription management utilities for WebSocket channels.
 * Tracks which clients are subscribed to which channels for efficient broadcasting.
 */

export class SubscriptionManager {
  // channelId -> Set of clientIds
  private channelSubscribers = new Map<string, Set<string>>();

  subscribe(channelId: string, clientId: string): void {
    if (!this.channelSubscribers.has(channelId)) {
      this.channelSubscribers.set(channelId, new Set());
    }
    this.channelSubscribers.get(channelId)!.add(clientId);
  }

  unsubscribe(channelId: string, clientId: string): void {
    const subs = this.channelSubscribers.get(channelId);
    if (subs) {
      subs.delete(clientId);
      if (subs.size === 0) {
        this.channelSubscribers.delete(channelId);
      }
    }
  }

  unsubscribeAll(clientId: string): void {
    for (const [channelId, subs] of this.channelSubscribers) {
      subs.delete(clientId);
      if (subs.size === 0) {
        this.channelSubscribers.delete(channelId);
      }
    }
  }

  getSubscribers(channelId: string): Set<string> {
    return this.channelSubscribers.get(channelId) || new Set();
  }

  getChannelCount(): number {
    return this.channelSubscribers.size;
  }
}
