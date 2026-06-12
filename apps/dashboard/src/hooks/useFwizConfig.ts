import { useEffect, useState } from 'react';

import type { FwizConfig } from '@federation-wizards/core';

interface UseFwizConfigResult {
  config: FwizConfig | null;
  loading: boolean;
  error: string | null;
}

export function useFwizConfig(): UseFwizConfigResult {
  const [config, setConfig] = useState<FwizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/config')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load config (${response.status})`);
        }
        return response.json() as Promise<FwizConfig>;
      })
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Unknown error';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading, error };
}
