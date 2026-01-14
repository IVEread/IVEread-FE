import { ApiError, ApiResponse } from '@/types/api';
import { getUserId } from '@/services/session';

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  auth?: boolean;
};

export const getApiBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
  }
  return baseUrl.replace(/\/+$/, '');
};

const buildQueryString = (query: RequestOptions['query']) => {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    params.append(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}${buildQueryString(query)}`;
};

const isApiResponse = (payload: unknown): payload is ApiResponse<unknown> => {
  return Boolean(payload && typeof payload === 'object' && 'success' in payload);
};

const extractApiError = (payload: unknown): ApiError | null => {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) {
    return null;
  }
  const error = (payload as { error?: ApiError }).error;
  if (!error || typeof error !== 'object') return null;
  return {
    code: String(error.code ?? 'UNKNOWN'),
    message: String(error.message ?? 'Unknown error'),
  };
};

const isFormData = (body: unknown): body is FormData => {
  if (!body || typeof body !== 'object') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return true;
  }
  return typeof (body as { append?: unknown }).append === 'function';
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.auth !== false) {
    const userId = await getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }
  }

  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    if (isFormData(options.body)) {
      init.body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(buildUrl(path, options.query), init);
  const payload = await parseJson(response);

  if (!response.ok) {
    const apiError = extractApiError(payload);
    throw new ApiClientError(apiError?.message ?? `Request failed (${response.status})`, {
      status: response.status,
      code: apiError?.code,
      details: payload,
    });
  }

  if (isApiResponse(payload)) {
    if (payload.success) {
      return payload.data as T;
    }
    throw new ApiClientError(payload.error.message, {
      status: response.status,
      code: payload.error.code,
      details: payload,
    });
  }

  return payload as T;
}
