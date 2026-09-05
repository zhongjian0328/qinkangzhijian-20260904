import { api } from './client';
import {
  EnvironmentTest,
  CreateEnvironmentTestInput,
} from '@qinkang/types';

export interface CategoryMetricSpec {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'boolean';
  warn?: number;
  crit?: number;
  direction?: 'high' | 'low';
  normalDesc: string;
}

export interface CategorySpec {
  label: string;
  description: string;
  metrics: CategoryMetricSpec[];
}

export const environmentApi = {
  categories: () => api.get<Record<string, CategorySpec>>('/environment/categories'),
  list: (params?: { houseId?: string; category?: string }) =>
    api.get<EnvironmentTest[]>('/environment/tests', { params }),
  create: (data: CreateEnvironmentTestInput) =>
    api.post<{ test: EnvironmentTest; flagged: any[] }>('/environment/tests', data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/environment/tests/${id}`),
};
