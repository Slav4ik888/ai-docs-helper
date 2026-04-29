import { useCallback, useEffect, useState } from 'react';
import { pinApi } from '../api/pinApi';
import { HttpError } from '@shared/api/axiosInstance';
import { TOKEN_STORAGE_KEY } from '@app/config/constants';

export function usePinGuard() {
  const [isAuthorized, setAuthorized] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [isVerifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onStorage = () => setAuthorized(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
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
        setAuthorized(true);
        return true;
      }
      setError('Неверный пин-код');
      return false;
    } catch (e) {
      if (e instanceof HttpError && e.status === 429) {
        setError('Слишком много попыток, подождите');
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
    setAuthorized(false);
  }, []);

  return { isAuthorized, isVerifying, error, verify, logout };
}
