import { api } from './client';
import { PoultryHouse } from '@qinkang/types';

export interface CreateHouseInput {
  name: string;
  capacity: number;
  currentCount?: number;
  species: string;
  age: number;
}

export const houseApi = {
  list: () => api.get<PoultryHouse[]>('/poultry-house'),
  create: (data: CreateHouseInput) => api.post<PoultryHouse>('/poultry-house', data),
  get: (id: string) => api.get<PoultryHouse>(`/poultry-house/${id}`),
};