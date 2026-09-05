import { api } from './client';
import {
  EpidemicRecord,
  CreateEpidemicInput,
  UpdateEpidemicInput,
} from '@qinkang/types';

export interface EpidemicStatistics {
  total: { count: number; affected: number; death: number };
  byLevel: { level: string; count: number; affected: number; death: number }[];
  byDisease: { disease: string; count: number; affected: number; death: number }[];
  byRegion: { city: string | null; count: number; affected: number; death: number }[];
}

export const epidemicApi = {
  create: (data: CreateEpidemicInput) => api.post<EpidemicRecord>('/epidemic', data),
  list: () => api.get<EpidemicRecord[]>('/epidemic'),
  get: (id: string) => api.get<EpidemicRecord>(`/epidemic/${id}`),
  update: (id: string, data: UpdateEpidemicInput) =>
    api.patch<EpidemicRecord>(`/epidemic/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/epidemic/${id}`),
  statistics: () => api.get<EpidemicStatistics>('/epidemic/statistics'),
};
