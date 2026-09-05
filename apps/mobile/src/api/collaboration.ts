import { api } from './client';
import {
  Collaboration,
  CollabMessage,
  CreateCollaborationInput,
  CreateCollabMessageInput,
} from '@qinkang/types';

export interface CollaborationDetail extends Omit<Collaboration, 'members'> {
  members: { userId: string; name: string; role: string }[];
  messages: CollabMessage[];
}

export const collaborationApi = {
  list: () => api.get<Collaboration[]>('/collaboration'),
  detail: (id: string) => api.get<CollaborationDetail>(`/collaboration/${id}`),
  create: (data: CreateCollaborationInput) =>
    api.post<Collaboration>('/collaboration', data),
  addMember: (id: string, data: { name: string; role?: string; userId?: string }) =>
    api.post<Collaboration>(`/collaboration/${id}/members`, data),
  postMessage: (id: string, data: CreateCollabMessageInput) =>
    api.post<CollabMessage>(`/collaboration/${id}/messages`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/collaboration/${id}`),
};
