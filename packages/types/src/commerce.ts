export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
export type ServiceType = 'on_site' | 'online' | 'lab_test';
export type ServiceOrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type ConsultationStatus = 'active' | 'closed';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
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

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  address?: string | null;
  phone?: string | null;
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
