export type BatchStatus = 'active' | 'completed' | 'archived';

export interface Batch {
  id: string;
  userId: string;
  houseId?: string | null;
  batchNo: string;
  breed: string;
  quantity: number;
  startDate: string;
  status: BatchStatus;
  notes?: string | null;
  dailyRecords?: DailyRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyRecord {
  id: string;
  batchId: string;
  recordDate: string;
  deathCount: number;
  cullCount: number;
  feedAmount: number;
  waterAmount: number;
  eggCount: number;
  temperature?: number | null;
  humidity?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateBatchInput {
  houseId?: string | null;
  batchNo: string;
  breed: string;
  quantity: number;
  startDate: string;
  notes?: string | null;
}

export interface UpdateBatchInput {
  houseId?: string | null;
  batchNo?: string;
  breed?: string;
  quantity?: number;
  startDate?: string;
  status?: BatchStatus;
  notes?: string | null;
}

export interface CreateDailyRecordInput {
  recordDate: string;
  deathCount?: number;
  cullCount?: number;
  feedAmount?: number;
  waterAmount?: number;
  eggCount?: number;
  temperature?: number | null;
  humidity?: number | null;
  notes?: string | null;
}

export interface ProductionDashboard {
  totalBatches: number;
  activeBatches: number;
  totalQuantity: number;
  cumulativeDeaths: number;
  cumulativeCulls: number;
  cumulativeEggs: number;
  latestRecords: { batchId: string; batchNo: string; record: DailyRecord }[];
}
