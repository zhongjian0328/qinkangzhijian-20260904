import { api } from './client';
import { Diagnosis } from '@qinkang/types';

export const diagnosisApi = {
  create: (data: { imageUrl: string; species: string; symptoms: string[] }) =>
    api.post<Diagnosis>('/diagnosis', data),
  list: () => api.get<Diagnosis[]>('/diagnosis'),
  get: (id: string) => api.get<Diagnosis>(`/diagnosis/${id}`),
};
