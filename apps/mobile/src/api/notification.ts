import { api } from './client';
import { Notification, NotificationType } from '@qinkang/types';

export const notificationApi = {
  list: (type?: NotificationType | 'all') =>
    api.get<Notification[]>(`/notifications${type && type !== 'all' ? `?type=${type}` : ''}`),
  unreadCount: () => api.get<number>('/notifications/unread-count'),
  markRead: (id: string) => api.post<Notification>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>('/notifications/read-all'),
};
