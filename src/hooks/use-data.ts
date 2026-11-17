import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { errorMessage } from '@/lib/errors';

export function useData<T>(query: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ query: () => Promise<T>; version: number; data?: T; error?: string }>();
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.resolve().then(query).then((data) => {
      if (active) setState({ query, version, data });
    }, (error) => {
      if (active) setState({ query, version, error: errorMessage(error) });
    });
    return () => { active = false; };
  }, [query, version]));

  const loading = state?.query !== query || state.version !== version;
  return { data: state?.query === query ? state.data : undefined, error: loading ? undefined : state?.error, loading, reload };
}

export function useAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function run(action: () => Promise<void>, confirmation = '') {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      setSuccess(confirmation);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { busy, error, success, run };
}
