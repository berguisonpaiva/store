import 'server-only';

import { apiFetch } from '@/lib/http';

/**
 * Discriminated result returned by every catalog Server Action. Success carries
 * the backend entity; failure carries the stable domain `code` (e.g.
 * `SKU_ALREADY_IN_USE`) and HTTP `status`, which the client maps to a field
 * error or a toast.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; status: number };

/**
 * Runs an authenticated mutation against the backend and normalizes the
 * response. The backend error body is `{ message: [CODE], ... }` (shared API
 * exception filter), so the first message entry is the domain code.
 */
export async function mutate<T>(
  path: string,
  init: RequestInit,
): Promise<ActionResult<T>> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch {
    // Network failure (backend down / unreachable). Fail gracefully so the UI
    // shows a toast instead of throwing an unhandled error in the transition.
    return { ok: false, code: 'NETWORK_ERROR', status: 0 };
  }

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR';
    try {
      const body = (await res.json()) as {
        message?: string[] | string;
        error?: string;
      };
      if (Array.isArray(body.message)) code = body.message[0] ?? code;
      else if (typeof body.message === 'string') code = body.message;
      else if (body.error) code = body.error;
    } catch {
      // non-JSON error body — keep the generic code
    }
    return { ok: false, code, status: res.status };
  }

  try {
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, code: 'INVALID_RESPONSE', status: res.status };
  }
}
