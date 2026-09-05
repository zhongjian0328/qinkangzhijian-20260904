import { api } from './client';
import {
  EpidemicAlert,
  CreateEpidemicAlertInput,
  UpdateEpidemicAlertInput,
} from '@qinkang/types';

export interface EpidemicAlertStats {
  total: number;
  active: number;
  resolved: number;
  severe: number;
  major: number;
  general: number;
}

export const epidemicAlertApi = {
  list: () => api.get<EpidemicAlert[]>('/epidemic-alert'),
  stats: () => api.get<EpidemicAlertStats>('/epidemic-alert/stats'),
  create: (data: CreateEpidemicAlertInput) => api.post<EpidemicAlert>('/epidemic-alert', data),
  update: (id: string, data: UpdateEpidemicAlertInput) =>
    api.patch<EpidemicAlert>(`/epidemic-alert/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/epidemic-alert/${id}`),
};
