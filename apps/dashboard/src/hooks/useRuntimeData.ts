import { useEffect, useState } from 'react';

import type { RuntimeSnapshot } from '@federation-wizards/mf-plugins';

interface UseRuntimeDataResult {
  snapshots: RuntimeSnapshot[];
  loading: boolean;
  error: string | null;
}

export function useRuntimeData(pollIntervalMs = 3000): UseRuntimeDataResult {
  const [snapshots, setSnapshots] = useState<RuntimeSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const response = await fetch('/api/runtime');

        if (!response.ok) {
          throw new Error(`Failed to load runtime (${response.status})`);
        }

        const data = (await response.json()) as RuntimeSnapshot[];

        if (!cancelled) {
          setSnapshots(data);
          setError(null);
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Unknown error';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return { snapshots, loading, error };
}
