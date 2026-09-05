import { api } from './client';
import {
  Immunization,
  CreateImmunizationInput,
  UpdateImmunizationInput,
  ImmunizationStats,
} from '@qinkang/types';

export interface ImmunizationReminders {
  overdue: Immunization[];
  dueSoon: Immunization[];
}

export const immunizationApi = {
  list: (status?: string) =>
    api.get<Immunization[]>('/immunization', status ? { params: { status } } : undefined),
  stats: () => api.get<ImmunizationStats>('/immunization/stats'),
  reminders: () => api.get<ImmunizationReminders>('/immunization/reminders'),
  create: (data: CreateImmunizationInput) => api.post<Immunization>('/immunization', data),
  update: (id: string, data: UpdateImmunizationInput) =>
    api.patch<Immunization>(`/immunization/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/immunization/${id}`),
};
