export type ImmunizationMethod =
  | 'injection'
  | 'water'
  | 'drop_eye'
  | 'drop_nose'
  | 'spray'
  | 'other';

export type ImmunizationStatus = 'planned' | 'completed' | 'overdue';

export interface Immunization {
  id: string;
  userId: string;
  houseId?: string | null;
  batchId?: string | null;
  vaccineName: string;
  disease?: string | null;
  method: ImmunizationMethod;
  dosage?: string | null;
  immunizedCount: number;
  administeredAt?: string | null;
  nextDueAt?: string | null;
  operator?: string | null;
  vaccineBatch?: string | null;
  manufacturer?: string | null;
  status: ImmunizationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImmunizationInput {
  houseId?: string;
  batchId?: string;
  vaccineName: string;
  disease?: string;
  method?: ImmunizationMethod;
  dosage?: string;
  immunizedCount?: number;
  administeredAt?: string | null;
  nextDueAt?: string | null;
  operator?: string;
  vaccineBatch?: string;
  manufacturer?: string;
  status?: ImmunizationStatus;
  notes?: string;
}

export interface UpdateImmunizationInput {
  houseId?: string | null;
  batchId?: string | null;
  vaccineName?: string;
  disease?: string;
  method?: ImmunizationMethod;
  dosage?: string;
  immunizedCount?: number;
  administeredAt?: string | null;
  nextDueAt?: string | null;
  operator?: string;
  vaccineBatch?: string;
  manufacturer?: string;
  status?: ImmunizationStatus;
  notes?: string;
}

export interface ImmunizationStats {
  total: number;
  planned: number;
  completed: number;
  overdue: number;
  dueSoon: number;
}
