import { api } from './client';
import {
  Product,
  Order,
  ServiceOrder,
  Consultation,
  CreateOrderInput,
  CreateServiceOrderInput,
  CreateConsultationInput,
  CommissionSummary,
} from '@qinkang/types';

export const commerceApi = {
  // 商品
  products: (params?: { category?: string; keyword?: string }) =>
    api.get<Product[]>('/commerce/products', { params }),
  product: (id: string) => api.get<Product>(`/commerce/products/${id}`),

  // 订单
  createOrder: (data: CreateOrderInput) => api.post<Order>('/commerce/orders', data),
  orders: () => api.get<Order[]>('/commerce/orders'),
  updateOrder: (id: string, status: string) =>
    api.put<Order>(`/commerce/orders/${id}`, { status }),
  commissions: () => api.get<CommissionSummary>('/commerce/commissions'),

  // 诊疗服务单
  createServiceOrder: (data: CreateServiceOrderInput) =>
    api.post<ServiceOrder>('/commerce/service-orders', data),
  serviceOrders: () => api.get<ServiceOrder[]>('/commerce/service-orders'),
  serviceOrderPool: () => api.get<ServiceOrder[]>('/commerce/service-orders/pool'),
  updateServiceOrder: (id: string, data: { action?: string; status?: string; price?: number }) =>
    api.put<ServiceOrder>(`/commerce/service-orders/${id}`, data),

  // 在线咨询
  createConsultation: (data: CreateConsultationInput) =>
    api.post<Consultation>('/commerce/consultations', data),
  consultations: () => api.get<Consultation[]>('/commerce/consultations'),
  consultationPool: () => api.get<Consultation[]>('/commerce/consultations/pool'),
  consultation: (id: string) => api.get<Consultation>(`/commerce/consultations/${id}`),
  sendMessage: (id: string, content: string) =>
    api.post<Consultation>(`/commerce/consultations/${id}/messages`, { content }),
};
