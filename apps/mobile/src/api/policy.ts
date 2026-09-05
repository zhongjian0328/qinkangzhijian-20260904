import { api } from './client';
import {
  Policy,
  PolicyStats,
  CreatePolicyInput,
  UpdatePolicyInput,
} from '@qinkang/types';

export const policyApi = {
  list: () => api.get<Policy[]>('/policy'),
  stats: () => api.get<PolicyStats[]>('/policy/stats'),
  detail: (id: string) => api.get<Policy>(`/policy/${id}`),
  create: (data: CreatePolicyInput) => api.post<Policy>('/policy', data),
  update: (id: string, data: UpdatePolicyInput) => api.patch<Policy>(`/policy/${id}`, data),
  markRead: (id: string) => api.post<{ success: boolean }>(`/policy/${id}/read`),
  remove: (id: string) => api.delete<{ success: boolean }>(`/policy/${id}`),
};
