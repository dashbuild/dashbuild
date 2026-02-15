type EventHandler = (...args: unknown[]) => void;

export class EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  // TODO: Add once() method for single-fire event listeners
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // BUG: Handlers that throw will prevent subsequent handlers from running
    for (const handler of handlers) {
      handler(...args);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}
