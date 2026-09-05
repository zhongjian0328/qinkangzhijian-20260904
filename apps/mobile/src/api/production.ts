import { api } from './client';
import {
  Batch,
  DailyRecord,
  ProductionDashboard,
  CreateBatchInput,
  UpdateBatchInput,
  CreateDailyRecordInput,
} from '@qinkang/types';

export const productionApi = {
  dashboard: () => api.get<ProductionDashboard>('/production/dashboard'),
  listBatches: () => api.get<Batch[]>('/production/batches'),
  createBatch: (data: CreateBatchInput) => api.post<Batch>('/production/batches', data),
  getBatch: (id: string) => api.get<Batch>(`/production/batches/${id}`),
  updateBatch: (id: string, data: UpdateBatchInput) =>
    api.patch<Batch>(`/production/batches/${id}`, data),
  removeBatch: (id: string) => api.delete<{ success: boolean }>(`/production/batches/${id}`),
  listRecords: (batchId: string) =>
    api.get<DailyRecord[]>(`/production/batches/${batchId}/records`),
  addRecord: (batchId: string, data: CreateDailyRecordInput) =>
    api.post<DailyRecord>(`/production/batches/${batchId}/records`, data),
  removeRecord: (recordId: string) =>
    api.delete<DailyRecord>(`/production/records/${recordId}`),
};
