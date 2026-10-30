type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Mock-data change bus. Services call notifyDataChanged() after mutating the
 * in-memory store; the app state context subscribes and bumps a version so
 * mounted pages refetch — mirroring how a real API + query invalidation works.
 */
export function notifyDataChanged(): void {
  listeners.forEach((l) => l());
}

export function subscribeDataChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
