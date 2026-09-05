export type NotificationType = 'warning' | 'diagnosis' | 'policy' | 'order' | 'teaching' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, string> | null;
  read: boolean;
  createdAt: string;
}
