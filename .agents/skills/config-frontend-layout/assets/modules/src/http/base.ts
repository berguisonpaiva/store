import { translateError } from '@/lib/error-translator';

// URL base da API
export const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3333';

export class APIError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export type FetchOptions = RequestInit;

type HttpClientInput = {
  path: string;
  options?: FetchOptions;
  // injeta headers extras (server/client)
  extraHeaders?: HeadersInit;
  // controle de credenciais sem “forçar include”
  credentials?: RequestCredentials;
};

/** Path usado nas requisições: prefixa /api quando a base (backend) não inclui /api. */
function buildRequestPath(path: string): string {
  if (!path) {
    throw new Error('Path is required for API requests');
  }
  if (BASE_URL.includes('/api')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.startsWith('/api') ? normalized : `/api${normalized}`;
}

export async function httpClient<T>({ path, options = {}, extraHeaders, credentials }: HttpClientInput): Promise<T> {
  const requestPath = buildRequestPath(path);
  const url = new URL(requestPath, BASE_URL);

  // mescla headers: options.headers + extraHeaders
  const headers = new Headers(options.headers);
  if (extraHeaders) {
    const extra = new Headers(extraHeaders);
    extra.forEach((v, k) => headers.set(k, v));
  }

  // Content-Type JSON automático quando faz sentido
  const method = (options.method ?? 'GET').toUpperCase();

  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const isFormData = hasBody && options.body instanceof FormData;
  const shouldSetJson =
    !headers.has('Content-Type') &&
    !isFormData &&
    method !== 'GET' &&
    method !== 'HEAD' &&
    !(method === 'DELETE' && !hasBody);

  if (shouldSetJson) headers.set('Content-Type', 'application/json');

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      ...options,
      method,
      headers,
      // não force include globalmente; default seguro:
      credentials: credentials ?? options.credentials ?? 'same-origin',
      cache: options.cache ?? 'no-store',
    });
  } catch (error) {
    throw new APIError(error instanceof Error ? error.message : 'Erro de conexão com o servidor', 0, {
      networkError: true,
      originalError: error,
    });
  }

  // Parse de resposta (json/text)
  let data: unknown = null;
  let rawBody: string | null = null;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      rawBody = await response.text();
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = { message: rawBody };
        }
      }
    }
  } catch {
    data = {
      message: `Erro ao processar resposta: ${response.status} ${response.statusText}`,
    };
  }

  if (!response.ok) {
    let errorMessage = 'Ocorreu um erro na requisição.';

    if (typeof data === 'string' && data) {
      errorMessage = data;
    } else if (isRecord(data)) {
      // 1. Extração do "message" ou "errors" do backend (NestJS BadRequestException)
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const rawErrors = data.errors
          .map((item) =>
            typeof item === 'string'
              ? item
              : item && typeof item === 'object' && 'message' in item
                ? String((item as { message?: unknown }).message)
                : String(item),
          )
          .filter(Boolean)
          .join(' | ');
        errorMessage = translateError(rawErrors);
      } else if (typeof data.message === 'string') {
        errorMessage = translateError(data.message);
      } else if (Array.isArray(data.message)) {
        errorMessage = translateError(data.message.join(' | '));
      }

      // 2. Extração de detalhes (fields/validation) do DomainExceptionFilter e do HttpExceptionFilter
      if (isRecord(data.details)) {
        if (Array.isArray(data.details.fields)) {
          const fieldErrors = data.details.fields
            .map((f) => {
              if (!isRecord(f)) return null;
              const field = f.field || f.path;
              const msg = f.message;
              return field ? `${field}: ${msg}` : msg;
            })
            .filter(Boolean)
            .join('; ');

          if (fieldErrors) {
            errorMessage += ` - Validações: ${fieldErrors}`;
          }
        }
      }

      // 3. Fallback ao formato legado caso erro esteja encadeado num objeto `data.error`
      const errorField = data.error;
      if (isRecord(errorField) && typeof errorField.message === 'string') {
        errorMessage = errorField.message;

        if (Array.isArray(errorField.details)) {
          const details = errorField.details
            .map((detail) => {
              if (!isRecord(detail)) return null;
              const msg = detail.message;
              const params = isRecord(detail.params) ? detail.params : null;
              const path = params?.path ?? detail.instancePath ?? detail.path ?? '';
              if (!msg) return null;
              const msgStr = typeof msg === 'string' ? msg : String(msg);
              const pathStr = typeof path === 'string' ? path : String(path || '');
              return pathStr ? `${pathStr}: ${msgStr}` : msgStr;
            })
            .filter((value): value is string => Boolean(value))
            .join('; ');

          if (details) errorMessage += ` - ${details}`;
        }
      }
    }

    throw new APIError(errorMessage, response.status, data);
  }

  return data as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
