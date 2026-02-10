import type { CanvasOnboardingPayload, Notification, VibeApp } from '../types';

type ApiResponse<T> = {
  data: T;
  error?: string;
  details?: string;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    const message = payload?.details || payload?.error || `Request failed: ${response.status}`;
    throw new Error(message);
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
  request<{ success: boolean }>('/api/canvas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
