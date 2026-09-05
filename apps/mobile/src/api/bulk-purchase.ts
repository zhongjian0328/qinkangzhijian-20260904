import { api } from './client';
import { BulkPurchase, CreateBulkPurchaseInput } from '@qinkang/types';

export const bulkPurchaseApi = {
  create: (data: CreateBulkPurchaseInput) => api.post<BulkPurchase>('/bulk-purchase', data),
  list: () => api.get<BulkPurchase[]>('/bulk-purchase'),
  detail: (id: string) => api.get<BulkPurchase>(`/bulk-purchase/${id}`),
  award: (id: string, bidId: string) =>
    api.post<BulkPurchase>(`/bulk-purchase/${id}/award`, { bidId }),
  cancel: (id: string) => api.put<BulkPurchase>(`/bulk-purchase/${id}/cancel`),
};
