import { api } from './client';
import { PoultryHouse, Alert, EnvironmentRecord } from '@qinkang/types';

export interface CreateHouseInput {
  name: string;
  capacity: number;
  currentCount?: number;
  species: string;
  age: number;
}

export interface UpdateHouseInput {
  name?: string;
  capacity?: number;
  currentCount?: number;
  species?: string;
  age?: number;
}

export interface EnvironmentInput {
  temperature: number;
  humidity: number;
  ammonia?: number | null;
  co2?: number | null;
  ventilation: string;
}

export const houseApi = {
  list: () => api.get<PoultryHouse[]>('/poultry-house'),
  create: (data: CreateHouseInput) => api.post<PoultryHouse>('/poultry-house', data),
  get: (id: string) => api.get<PoultryHouse>(`/poultry-house/${id}`),
  update: (id: string, data: UpdateHouseInput) =>
    api.patch<PoultryHouse>(`/poultry-house/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/poultry-house/${id}`),
  getEnvironment: (id: string) =>
    api.get<EnvironmentRecord[]>(`/poultry-house/${id}/environment`),
  addEnvironment: (id: string, data: EnvironmentInput) =>
    api.post<{ record: EnvironmentRecord; alerts: Alert[] }>(
      `/poultry-house/${id}/environment`,
      data,
    ),
  getAlerts: (id: string) => api.get<Alert[]>(`/poultry-house/${id}/alerts`),
  acknowledgeAlert: (alertId: string) =>
    api.post<Alert>(`/poultry-house/alerts/${alertId}/acknowledge`),
};