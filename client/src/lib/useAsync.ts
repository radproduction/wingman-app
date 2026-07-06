import { useCallback, useEffect, useState } from 'react';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    try {
      setError(null);
      const d = await fn();
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  const refresh = useCallback(async () => { await run(); }, [run]);

  return { data, loading, error, refresh, setData };
}
