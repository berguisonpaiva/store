import { auth } from '@/lib/auth';
import { translateError } from '@/lib/error-translator';

export type FetchOptions = Omit<RequestInit, 'body'> & {
  headers?: HeadersInit;
};

type ServerClientOptions = {
  forwardCookies?: boolean;
};

type HttpClientParams = {
  path: string;
  options?: RequestInit;
  extraHeaders?: Headers;
};

type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3333';

// ─── httpClient ──────────────────────────────────────────────────────────────

async function httpClient<T>({ path, options = {}, extraHeaders }: HttpClientParams): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${path}`;
    const hadAuth = extraHeaders?.has?.('Authorization') ?? false;

    const headers = new Headers(extraHeaders);

    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => response.statusText);
      let message = 'Ocorreu um erro na requisição.';
      let parsed: unknown = null;

      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { message: raw };
      }

      if (typeof parsed === 'string' && parsed) {
        message = translateError(parsed);
      } else if (isRecord(parsed)) {
        // 1. Extração do "message" ou "errors" do backend (NestJS BadRequestException)
        if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
          const rawErrors = parsed.errors
            .map((item) =>
              typeof item === 'string'
                ? item
                : item && typeof item === 'object' && 'message' in item
                  ? String((item as { message?: unknown }).message)
                  : String(item),
            )
            .filter(Boolean)
            .join(' | ');
          message = translateError(rawErrors);
        } else if (typeof parsed.message === 'string') {
          message = translateError(parsed.message);
        } else if (Array.isArray(parsed.message)) {
          message = translateError(parsed.message.join(' | '));
        }

        // 2. Extração de detalhes (fields/validation)
        if (isRecord(parsed.details)) {
          if (Array.isArray(parsed.details.fields)) {
            const fieldErrors = parsed.details.fields
              .map((f: unknown) => {
                if (!isRecord(f)) return null;
                const field = typeof f.field === 'string' ? f.field : typeof f.path === 'string' ? f.path : '';
                const msg = typeof f.message === 'string' ? f.message : String(f.message);
                return field ? `${field}: ${msg}` : msg;
              })
              .filter(Boolean)
              .join('; ');

            if (fieldErrors) {
              message += ` - Validações: ${fieldErrors}`;
            }
          }
        }

        // 3. Fallback ao formato legado ou auth 401
        if (response.status === 401) {
          message = 'Sessão expirada. Faça login novamente.';
          const backendMsg = isRecord(parsed) && typeof parsed.message === 'string' ? parsed.message : raw;
          console.warn(`[auth] 401 em ${path} | token enviado: ${hadAuth} | backend: ${backendMsg}`);
        }
      } else {
        if (response.status === 401) {
          message = 'Sessão expirada. Faça login novamente.';
          console.warn(`[auth] 401 em ${path} | token enviado: ${hadAuth}`);
        }
      }

      return { data: null, error: message };
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return { data: null as T, error: null };
    }

    const data: T = await response.json();
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado';
    return { data: null, error: message };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// ─── buildServerHeaders ───────────────────────────────────────────────────────

class SessionExpiredError extends Error {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'SessionExpiredError';
  }
}

async function buildServerHeaders(options?: FetchOptions, cfg: ServerClientOptions = {}): Promise<Headers> {
  const headers = new Headers(options?.headers);

  const session = await auth();
  const accessToken = (session as { accessToken?: string; error?: string })?.accessToken;
  const sessionError = (session as { error?: string })?.error;

  if (sessionError === 'RefreshTokenExpired') {
    throw new SessionExpiredError();
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (cfg.forwardCookies) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieStrings = cookieStore.getAll().map((c) => `${c.name}=${c.value}`);

    if (cookieStrings.length > 0 && !headers.has('Cookie')) {
      headers.set('Cookie', cookieStrings.join('; '));
    }
  }

  return headers;
}

// ─── createServerClient ───────────────────────────────────────────────────────

async function runAuthed<T>(
  options: FetchOptions | undefined,
  cfg: ServerClientOptions,
  run: (headers: Headers) => Promise<ApiResponse<T>>,
): Promise<ApiResponse<T>> {
  try {
    const headers = await buildServerHeaders(options, cfg);
    return await run(headers);
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      return { data: null, error: err.message };
    }
    throw err;
  }
}

export async function createServerClient(cfg: ServerClientOptions = {}) {
  return {
    get: <T>(path: string, options?: FetchOptions) =>
      runAuthed<T>(options, cfg, (headers) =>
        httpClient<T>({
          path,
          options: { ...options, method: 'GET', cache: 'no-store' },
          extraHeaders: headers,
        }),
      ),

    post: <T>(path: string, body: unknown, options?: FetchOptions) =>
      runAuthed<T>(options, cfg, (headers) =>
        httpClient<T>({
          path,
          options: {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
            cache: 'no-store',
          },
          extraHeaders: headers,
        }),
      ),

    put: <T>(path: string, body: unknown, options?: FetchOptions) =>
      runAuthed<T>(options, cfg, (headers) =>
        httpClient<T>({
          path,
          options: {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
            cache: 'no-store',
          },
          extraHeaders: headers,
        }),
      ),

    patch: <T>(path: string, body: unknown, options?: FetchOptions) =>
      runAuthed<T>(options, cfg, (headers) =>
        httpClient<T>({
          path,
          options: {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
            cache: 'no-store',
          },
          extraHeaders: headers,
        }),
      ),

    delete: <T>(path: string, options?: FetchOptions) =>
      runAuthed<T>(options, cfg, (headers) =>
        httpClient<T>({
          path,
          options: { ...options, method: 'DELETE', cache: 'no-store' },
          extraHeaders: headers,
        }),
      ),

    postFormData: <T>(path: string, formData: FormData, options?: FetchOptions) =>
      runAuthed<T>(options, cfg, (headers) =>
        httpClient<T>({
          path,
          options: {
            ...options,
            method: 'POST',
            body: formData,
            cache: 'no-store',
          },
          extraHeaders: headers,
        }),
      ),
  };
}
