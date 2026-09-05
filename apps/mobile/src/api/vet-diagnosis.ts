import { api } from './client';
import { VetCase, VetDiagnosisResult } from '@qinkang/types';

export interface VetCasePayload {
  species?: string;
  basicInfo?: Record<string, any>;
  chiefComplaint?: Record<string, any>;
  clinicalSymptoms?: Record<string, any>;
  necropsyLesions?: Record<string, any>;
  labTests?: Record<string, any>;
  immuneHistory?: Record<string, any>;
  medicationHistory?: Record<string, any>;
  environment?: Record<string, any>;
  epidemiology?: Record<string, any>;
  imageUrls?: string[];
  role?: string;
  subRole?: string;
}

export const vetDiagnosisApi = {
  upload: (images: string[]) => api.post<{ urls: string[] }>('/upload', { images }),
  createCase: (data: VetCasePayload) => api.post<VetCase>('/vet-diagnosis/cases', data),
  list: (params?: { take?: number; skip?: number }) => {
    const query: Record<string, string> | undefined = params
      ? Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        )
      : undefined;
    return api.get<VetCase[]>('/vet-diagnosis/cases', { params: query });
  },
  get: (id: string) => api.get<VetCase>(`/vet-diagnosis/cases/${id}`),
  retry: (id: string, role?: string, subRole?: string) =>
    api.post<VetCase>(`/vet-diagnosis/cases/${id}/diagnose`, { role, subRole }),
  feedback: (id: string, feedback: string) =>
    api.post<VetCase>(`/vet-diagnosis/cases/${id}/feedback`, { feedback }),
  saveOffline: (data: VetCasePayload & { diagnosisResult: VetDiagnosisResult; confidence: number }) =>
    api.post<VetCase>('/vet-diagnosis/offline', data),
};