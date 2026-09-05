export type CustomerLevel = 'vip' | 'regular' | 'potential';

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  phone?: string | null;
  farmName?: string | null;
  species?: string | null;
  scale?: number | null;
  address?: string | null;
  level: CustomerLevel;
  notes?: string | null;
  tags: string[];
  nextFollowUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  farmName?: string;
  species?: string;
  scale?: number;
  address?: string;
  level?: CustomerLevel;
  notes?: string;
  tags?: string[];
  nextFollowUpAt?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  farmName?: string;
  species?: string;
  scale?: number;
  address?: string;
  level?: CustomerLevel;
  notes?: string;
  tags?: string[];
  nextFollowUpAt?: string | null;
}
