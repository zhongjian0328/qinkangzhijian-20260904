export type BulkPurchaseStatus = 'open' | 'awarded' | 'completed' | 'cancelled';

export interface BulkPurchaseItem {
  name: string;
  spec?: string | null;
  quantity: number;
  requirement?: string | null;
}

export interface BulkPurchase {
  id: string;
  userId: string;
  title: string;
  items: BulkPurchaseItem[];
  deadline?: string | null;
  status: BulkPurchaseStatus;
  winnerBidId?: string | null;
  createdAt: string;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  bulkPurchaseId: string;
  merchantId: string;
  price: number;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  createdAt: string;
  merchant?: { id: string; username: string } | null;
}

export interface MerchantDashboard {
  productCount: number;
  orderCount: number;
  revenue: number;
  pendingShipCount: number;
  openBulkCount: number;
}

export interface CreateProductInput {
  name: string;
  category: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
  unit: string;
  description?: string | null;
  manufacturer?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  price?: number;
  promoPrice?: number | null;
  stock?: number;
  unit?: string;
  description?: string | null;
  manufacturer?: string | null;
}

export interface CreateBulkPurchaseInput {
  title: string;
  items: BulkPurchaseItem[];
  deadline?: string | null;
}

export interface CreateBidInput {
  price: number;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
}
