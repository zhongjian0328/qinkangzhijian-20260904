import { api } from './client';
import {
  Annotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
} from '@qinkang/types';

export interface AnnotationStats {
  total: number;
  pending: number;
  verified: number;
  special: number;
}

export const annotationApi = {
  list: () => api.get<Annotation[]>('/annotation'),
  pool: () => api.get<Annotation[]>('/annotation/pool'),
  stats: () => api.get<AnnotationStats>('/annotation/stats'),
  create: (data: CreateAnnotationInput) => api.post<Annotation>('/annotation', data),
  update: (id: string, data: UpdateAnnotationInput) =>
    api.patch<Annotation>(`/annotation/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/annotation/${id}`),
};
