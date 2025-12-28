/**
 * API Client - Base fetch utilities
 */

import type { ApiError } from './types';

export interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

let globalConfig: ClientConfig = {
  baseUrl: '/api',
};

export function configureClient(config: Partial<ClientConfig>) {
  globalConfig = { ...globalConfig, ...config };
}

export function getClientConfig(): ClientConfig {
  return globalConfig;
}

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText, code: 'UNKNOWN_ERROR' };
    }
    throw new ApiClientError(
      errorData.error,
      errorData.code,
      response.status
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const config = getClientConfig();
  const url = new URL(path, config.baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    credentials: 'include',
  });

  return handleResponse<T>(response);
}

export async function apiPost<T, D = unknown>(
  path: string,
  data?: D
): Promise<T> {
  const config = getClientConfig();
  const url = new URL(path, config.baseUrl);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
}

export async function apiPatch<T, D = unknown>(
  path: string,
  data: D
): Promise<T> {
  const config = getClientConfig();
  const url = new URL(path, config.baseUrl);

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const config = getClientConfig();
  const url = new URL(path, config.baseUrl);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    credentials: 'include',
  });

  return handleResponse<T>(response);
}

