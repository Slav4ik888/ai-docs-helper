import { useCallback, useEffect, useState } from 'react';
import { pinApi } from '../api/pinApi';
import { HttpError } from '@shared/api/axiosInstance';
import { TOKEN_STORAGE_KEY } from '@app/config/constants';

/**
 * Module-level shared state so every component that calls usePinGuard()
 * sees the same authorization status. (Without this, the PinModal and the
 * AdminPage each had their own React state, so authorizing in the modal
 * would never re-render the page.)
 */
type Listener = (authorized: boolean) => void;
const listeners = new Set<Listener>();
let isAuthorizedShared = typeof window !== 'undefined' && Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY));

function setAuthorizedShared(value: boolean) {
  if (isAuthorizedShared === value) return;
  isAuthorizedShared = value;
  for (const listener of listeners) listener(value);
}

export function usePinGuard() {
  const [isAuthorized, setAuthorized] = useState<boolean>(isAuthorizedShared);
  const [isVerifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener: Listener = (v) => setAuthorized(v);
    listeners.add(listener);
    // Sync once in case state changed before subscribe
    setAuthorized(isAuthorizedShared);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Also react to changes from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== TOKEN_STORAGE_KEY) return;
      setAuthorizedShared(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const verify = useCallback(async (pin: string) => {
    setVerifying(true);
    setError(null);
    try {
      const res = await pinApi.verify(pin);
      if (res?.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        setAuthorizedShared(true);
        return true;
      }
      setError('Неверный пин-код');
      return false;
    } catch (e) {
      if (e instanceof HttpError && e.status === 429) {
        setError('Слишком много попыток, подождите секунду и попробуйте ещё раз');
      } else if (e instanceof HttpError && e.status === 401) {
        setError('Неверный пин-код');
      } else {
        setError(e instanceof Error ? e.message : 'Ошибка проверки');
      }
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthorizedShared(false);
  }, []);

  return { isAuthorized, isVerifying, error, verify, logout };
}
