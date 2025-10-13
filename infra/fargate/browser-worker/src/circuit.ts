export type ExecFn<T> = () => Promise<T>;

type State = 'closed' | 'open' | 'half-open';

export function createBreaker(
  name: string,
  maxFailures = 5,
  coolDownMs = 30000,
  onChange?: (state: State) => void,
) {
  let state: State = 'closed';
  let failures = 0;
  let nextTry = 0;

  function setState(next: State) {
    if (state !== next) {
      state = next;
      try { onChange && onChange(state); } catch {}
    }
  }

  function onSuccess() {
    failures = 0;
    if (state !== 'closed') {
      setState('closed');
      console.info(`[CB] close: ${name}`);
    }
  }

  function onFailure() {
    failures++;
    if (failures >= maxFailures) {
      setState('open');
      nextTry = Date.now() + coolDownMs;
      console.warn(`[CB] open: ${name}`);
    }
  }

  async function exec<T>(fn: ExecFn<T>): Promise<T> {
    const now = Date.now();
    if (state === 'open') {
      if (now >= nextTry) {
        setState('half-open');
        console.info(`[CB] half-open: ${name}`);
      } else {
        throw new Error(`CircuitOpen:${name}`);
      }
    }
    try {
      const res = await fn();
      onSuccess();
      return res;
    } catch (e) {
      onFailure();
      throw e;
    }
  }

  return { exec };
}
