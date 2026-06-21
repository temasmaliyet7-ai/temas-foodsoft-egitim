import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Access token bellekte tutulur (localStorage'da DEĞİL — XSS sertleştirme).
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // refresh cookie için
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 401 alınca bir kez refresh dene, sonra isteği tekrarla.
let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post('/api/auth/refresh', null, { withCredentials: true })
      .then((res) => {
        const token = res.data?.accessToken as string | undefined;
        setAccessToken(token ?? null);
        return token ?? null;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true;
      const token = await tryRefresh();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

// Hata mesajını backend'in {error} zarfından çıkar.
export function apiErrorMessage(err: unknown, fallback = 'Bir hata oluştu.'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string } | undefined)?.error ?? err.message ?? fallback;
  }
  return fallback;
}
