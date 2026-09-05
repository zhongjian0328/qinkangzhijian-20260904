export type EpidemicLevel = 'suspected' | 'confirmed' | 'controlled';

export interface EpidemicRecord {
  id: string;
  userId: string;
  location: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  disease: string;
  affectedCount: number;
  deathCount: number;
  symptoms?: string | null;
  level: EpidemicLevel;
  reportedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpidemicInput {
  location: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  disease: string;
  affectedCount: number;
  deathCount?: number;
  symptoms?: string | null;
  level?: EpidemicLevel;
}

export interface UpdateEpidemicInput {
  level?: EpidemicLevel;
  disease?: string;
  affectedCount?: number;
  deathCount?: number;
  symptoms?: string | null;
}

/** 区域疫情聚合统计 */
export interface EpidemicRegionStat {
  province?: string | null;
  city?: string | null;
  district?: string | null;
  count: number;
  totalAffected: number;
  totalDeath: number;
}
