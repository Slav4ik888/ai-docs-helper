/**
 * Despite the name (kept for FSD spec compatibility), this uses the native
 * fetch API per the project requirements. It provides a small wrapper that:
 *   - Prepends the JWT (if present) to admin requests
 *   - Parses JSON
 *   - Throws an Error with status when the response is not ok
 *   - Auto-clears auth state when a protected request returns 401
 */
import { TOKEN_STORAGE_KEY } from '@app/config/constants';
import { clearAuth } from '@shared/auth/authState';

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  multipart?: boolean;
};

export class HttpError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { auth, multipart, body, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };

  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body;
  } else if (multipart) {
    finalBody = body as BodyInit;
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  if (auth) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...rest, headers: finalHeaders, body: finalBody });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearAuth();
    }
    const message =
      (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).error)
        : `Request failed with status ${res.status}`);
    throw new HttpError(res.status, message, data);
  }

  return data as T;
}
