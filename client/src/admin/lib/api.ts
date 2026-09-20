/**
 * REST client for the FreshMart Express/MongoDB backend.
 *
 * Centralizes base URL, JWT storage, the `{ success, data, error }` envelope,
 * and transparent access-token refresh on a 401. Admin services call `api.get`
 * / `api.post` / etc. instead of talking to Supabase directly.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

const ACCESS_KEY = 'fm_access_token';
const REFRESH_KEY = 'fm_refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Query string params; undefined/null values are skipped. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Skip the Authorization header (used by login/refresh themselves). */
  auth?: boolean;
  /** Internal: prevents infinite refresh recursion. */
  _retried?: boolean;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(BASE_URL + (path.startsWith('/') ? path : `/${path}`));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

// Single-flight refresh so concurrent 401s don't fire multiple refreshes.
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) return false;
        tokenStore.set(json.data);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true, _retried = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  if (res.status === 204) return undefined as T;

  // Transparent refresh-and-retry on an expired/invalid access token.
  if (res.status === 401 && auth && !_retried && tokenStore.refresh) {
    const refreshed = await refreshTokens();
    if (refreshed) return request<T>(path, { ...options, _retried: true });
    tokenStore.clear();
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const message = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json?.error?.details);
  }
  return json.data as T;
}

/* ------------------------- Binary / multipart I/O ------------------------- */

/**
 * Authenticated fetch that hands back the raw Response, so callers can read a
 * file download instead of the JSON envelope. Mirrors `request`'s single
 * transparent refresh-and-retry on an expired access token.
 */
async function authFetch(
  path: string,
  init: RequestInit & { params?: RequestOptions['params'] },
  retried = false
): Promise<Response> {
  const { params, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = { ...((headers as Record<string, string>) ?? {}) };
  if (tokenStore.access) finalHeaders.Authorization = `Bearer ${tokenStore.access}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), { ...rest, headers: finalHeaders });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  if (res.status === 401 && !retried && tokenStore.refresh) {
    if (await refreshTokens()) return authFetch(path, init, true);
    tokenStore.clear();
  }
  return res;
}

/** Turn a failed Response into the same ApiError shape `request` throws. */
async function throwFromResponse(res: Response): Promise<never> {
  const json = await res.json().catch(() => null);
  const message = json?.error?.message || json?.message || `Request failed (${res.status})`;
  throw new ApiError(message, res.status, json?.error?.details);
}

/** GET a file (template download). Returns the blob plus the server's filename. */
export async function apiDownload(
  path: string,
  params?: RequestOptions['params']
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await authFetch(path, { method: 'GET', params });
  if (!res.ok) await throwFromResponse(res);
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return { blob: await res.blob(), filename: match ? decodeURIComponent(match[1]) : null };
}

/** POST multipart form data (file upload) and unwrap the JSON envelope. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  // No Content-Type header: the browser must set the multipart boundary itself.
  const res = await authFetch(path, { method: 'POST', body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const message = json?.error?.message || json?.message || `Upload failed (${res.status})`;
    throw new ApiError(message, res.status, json?.error?.details);
  }
  return json.data as T;
}

/** Save a blob to disk under the given filename. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { params }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Shared list fetcher mapping the frontend's ListParams (page/search/sort/filters)
 * onto the backend's `{ rows, total }` paginated endpoints. Used by every table.
 */
export async function apiList<T>(
  path: string,
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    filters?: Record<string, string | number | boolean | null | undefined>;
  } = {}
): Promise<{ rows: T[]; total: number }> {
  const { page = 1, pageSize = 10, search = '', sortBy, sortDir, filters = {} } = params;
  const query: Record<string, string | number | boolean> = { page, pageSize };
  if (search) query.search = search;
  if (sortBy) query.sortBy = sortBy;
  if (sortDir) query.sortDir = sortDir;
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') query[k] = v;
  }
  return api.get<{ rows: T[]; total: number }>(path, query);
}
