import { TOKEN_STORAGE_KEY } from '@app/config/constants';

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

type Listener = (authorized: boolean) => void;
const listeners = new Set<Listener>();

export let isAuthorizedShared =
  typeof window !== 'undefined' && isTokenValid(localStorage.getItem(TOKEN_STORAGE_KEY));

export function setAuthorizedShared(value: boolean) {
  if (isAuthorizedShared === value) return;
  isAuthorizedShared = value;
  for (const listener of listeners) listener(value);
}

export function addAuthListener(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  setAuthorizedShared(false);
}
