import { api } from './client';
import { Diagnosis } from '@qinkang/types';

export const diagnosisApi = {
  upload: (images: string[]) => api.post<{ urls: string[] }>('/upload', { images }),
  create: (data: { imageUrls: string[]; species: string; symptoms: string[]; role?: string; subRole?: string }) =>
    api.post<Diagnosis>('/diagnosis', data),
  list: (params?: { take?: number; skip?: number }) => {
    const query: Record<string, string> | undefined = params
      ? Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        )
      : undefined;
    return api.get<Diagnosis[]>('/diagnosis', { params: query });
  },
  get: (id: string) => api.get<Diagnosis>(`/diagnosis/${id}`),
};
