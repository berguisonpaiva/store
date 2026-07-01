import { auth } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Server-side fetch helper for the backend API. Reads the current session and
 * attaches `Authorization: Bearer <accessToken>` when available. Use from
 * Server Components / Server Actions (module data layers).
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const session = await auth();
  const token = session?.accessToken;

  const headers = new Headers(init.headers);
  // Only declare a JSON content-type when there's actually a body. A Fastify
  // backend rejects an empty body sent with `content-type: application/json`
  // (400), which would otherwise break body-less PATCH calls like
  // activate/deactivate.
  if (init.body !== undefined && init.body !== null && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

/** Like {@link apiFetch} but parses JSON and throws on non-2xx. */
export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}
