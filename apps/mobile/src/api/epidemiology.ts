import { api } from './client';
import {
  Epidemiology,
  CreateEpidemiologyInput,
  UpdateEpidemiologyInput,
} from '@qinkang/types';

export interface EpidemiologyStats {
  total: number;
  investigating: number;
  processing: number;
  completed: number;
}

export const epidemiologyApi = {
  list: (status?: string) =>
    api.get<Epidemiology[]>('/epidemiology', status ? { params: { status } } : undefined),
  stats: () => api.get<EpidemiologyStats>('/epidemiology/stats'),
  create: (data: CreateEpidemiologyInput) => api.post<Epidemiology>('/epidemiology', data),
  update: (id: string, data: UpdateEpidemiologyInput) =>
    api.patch<Epidemiology>(`/epidemiology/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/epidemiology/${id}`),
};
