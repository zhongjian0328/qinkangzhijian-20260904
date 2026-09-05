export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
export type ServiceType = 'on_site' | 'online' | 'lab_test';
export type ServiceOrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type ConsultationStatus = 'active' | 'closed';

export interface Product {
  id: string;
  merchantId?: string | null;
  name: string;
  category: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
  sales: number;
  unit: string;
  description?: string | null;
  image?: string | null;
  manufacturer?: string | null;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface LogisticsEvent {
  status: string;
  desc: string;
  time: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  address?: string | null;
  phone?: string | null;
  merchantId?: string | null;
  referralVetId?: string | null;
  commissionAmount?: number | null;
  logistics?: LogisticsEvent[] | null;
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  userId: string;
  serviceType: ServiceType;
  description?: string | null;
  address?: string | null;
  appointmentAt?: string | null;
  status: ServiceOrderStatus;
  vetId?: string | null;
  price?: number | null;
  createdAt: string;
}

export interface ConsultationMessage {
  role: 'user' | 'vet';
  content: string;
  timestamp: string;
}

export interface Consultation {
  id: string;
  userId: string;
  vetId?: string | null;
  subject: string;
  messages: ConsultationMessage[];
  status: ConsultationStatus;
  createdAt: string;
}

export interface CreateOrderInput {
  items: OrderItem[];
  address?: string | null;
  phone?: string | null;
  referralVetId?: string | null;
}

export interface Commission {
  orderId: string;
  totalAmount: number;
  commissionAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CommissionSummary {
  totalCommission: number;
  settledCommission: number;
  orders: Commission[];
}

export interface CreateServiceOrderInput {
  serviceType: ServiceType;
  description?: string | null;
  address?: string | null;
  appointmentAt?: string | null;
}

export interface CreateConsultationInput {
  subject: string;
  initialMessage?: string;
}
