import { api } from './client';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@qinkang/types';

export interface CustomerStats {
  total: number;
  vip: number;
  regular: number;
  potential: number;
  dueCount: number;
}

export const customerApi = {
  list: () => api.get<Customer[]>('/customer'),
  stats: () => api.get<CustomerStats>('/customer/stats'),
  create: (data: CreateCustomerInput) => api.post<Customer>('/customer', data),
  update: (id: string, data: UpdateCustomerInput) =>
    api.patch<Customer>(`/customer/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/customer/${id}`),
};
