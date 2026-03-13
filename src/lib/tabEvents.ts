// Lightweight event emitter for tab-level events (e.g. scroll-to-top on re-tap)

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export const tabEvents = {
  /** Subscribe to a tab event. Returns an unsubscribe function. */
  on(event: string, listener: Listener): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(listener);
    return () => {
      listeners.get(event)?.delete(listener);
    };
  },

  /** Emit an event to all subscribers. */
  emit(event: string): void {
    listeners.get(event)?.forEach((fn) => fn());
  },
};
