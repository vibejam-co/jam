import type {
  CanvasCatalogResponse,
  CanvasSessionResponse,
  CanvasOnboardingPayload,
  CanvasPublishResult,
  Notification,
  VibeApp,
} from '../types';
import { supabase } from './supabase-client';

type ApiResponse<T> = {
  data: T;
  error?: string;
  details?: string;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const rawBody = await response.text();
  const payload = (isJson && rawBody ? (JSON.parse(rawBody) as ApiResponse<T>) : null);

  if (!response.ok) {
    const message =
      payload?.details ||
      payload?.error ||
      (rawBody ? rawBody.slice(0, 160) : '') ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error(`Expected JSON response from ${path}, received ${contentType || 'unknown content-type'}.`);
  }

  return payload.data;
};

export const fetchApps = () => request<VibeApp[]>('/api/apps');

export const publishApp = (app: VibeApp) =>
  request<VibeApp[]>('/api/apps', {
    method: 'POST',
    body: JSON.stringify({ app }),
  });

export const fetchNotifications = () => request<Notification[]>('/api/notifications');

export const subscribeToNewsletter = (email: string) =>
  request<{ success: boolean }>('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const saveCanvasOnboarding = (payload: CanvasOnboardingPayload) =>
  request<CanvasPublishResult>('/api/canvas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchCanvasCatalog = () => request<CanvasCatalogResponse>('/api/canvas');

export const fetchMyCanvasSession = () =>
  request<CanvasSessionResponse>('/api/canvas?mode=session');
