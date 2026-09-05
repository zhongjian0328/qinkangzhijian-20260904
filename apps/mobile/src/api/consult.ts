import { api } from './client';
import { ConsultSession } from '@qinkang/types';

export interface SendConsultResponse {
  sessionId: string;
  reply: string;
  diagnosis: {
    preliminaryDiagnosis: string;
    confidence: number;
    suggestions: string[];
    nextSteps: string;
  } | null;
  messages: any[];
}

export const consultApi = {
  send: (data: {
    sessionId?: string;
    content: string;
    imageUrls?: string[];
    role?: string;
    subRole?: string;
  }) => api.post<SendConsultResponse>('/consult/message', data),
  list: () => api.get<ConsultSession[]>('/consult/sessions'),
  get: (id: string) => api.get<ConsultSession>(`/consult/sessions/${id}`),
  remove: (id: string) => api.delete<{ success: boolean }>(`/consult/sessions/${id}`),
};
