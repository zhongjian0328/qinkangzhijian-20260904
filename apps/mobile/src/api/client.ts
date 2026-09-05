export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** 把后端返回的相对路径（如 /uploads/xxx.jpg）解析成完整可访问 URL */
export function assetUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:|data:|file:|blob:)/i.test(path)) return path;
  return new URL(path, API_BASE_URL).toString();
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  timeoutMs?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { params, timeoutMs = 60000, ...init } = options;

    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), { ...init, headers, signal: controller.signal });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: '请求失败' }));
        throw new Error(error.message ?? '请求失败');
      }

      return response.json();
    } catch (e) {
      if ((e as any)?.name === 'AbortError') {
        throw new Error('请求超时，请检查网络后重试');
      }
      if (e instanceof TypeError || (e as any)?.message === 'Network request failed') {
        throw new Error('网络连接失败，请检查网络后重试');
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(path: string, options?: FetchOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: object, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: object, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: object, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: FetchOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
