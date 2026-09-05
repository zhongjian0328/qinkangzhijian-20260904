import { api } from './client';
import {
  Product,
  Order,
  Bid,
  BulkPurchase,
  MerchantDashboard,
  CreateProductInput,
  UpdateProductInput,
  CreateBidInput,
} from '@qinkang/types';

export const merchantApi = {
  dashboard: () => api.get<MerchantDashboard>('/merchant/dashboard'),

  products: () => api.get<Product[]>('/merchant/products'),
  createProduct: (data: CreateProductInput) => api.post<Product>('/merchant/products', data),
  updateProduct: (id: string, data: UpdateProductInput) =>
    api.put<Product>(`/merchant/products/${id}`, data),
  deleteProduct: (id: string) => api.delete<{ success: boolean }>(`/merchant/products/${id}`),

  orders: () => api.get<Order[]>('/merchant/orders'),
  shipOrder: (id: string, data: { logisticsCompany?: string; trackingNo?: string }) =>
    api.put<Order>(`/merchant/orders/${id}/ship`, data),
  refundOrder: (id: string, reason?: string) =>
    api.put<Order>(`/merchant/orders/${id}/refund`, { reason }),

  bulkPurchases: () => api.get<BulkPurchase[]>('/merchant/bulk-purchases'),
  createBid: (bulkPurchaseId: string, data: CreateBidInput) =>
    api.post<Bid>(`/merchant/bulk-purchases/${bulkPurchaseId}/bids`, data),
};
