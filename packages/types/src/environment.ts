export type EnvironmentCategory = 'air' | 'water' | 'feed' | 'surface';
export type EnvironmentResult = 'normal' | 'warning' | 'abnormal';

/** 空气检测指标 */
export interface AirMetrics {
  ammonia?: number | null; // mg/m³
  co2?: number | null; // ppm
  dust?: number | null; // mg/m³
  hydrogenSulfide?: number | null; // mg/m³
}

/** 水样检测指标 */
export interface WaterMetrics {
  ph?: number | null;
  bacteria?: number | null; // 细菌总数 CFU/mL
  coliform?: number | null; // 大肠杆菌群
  turbidity?: number | null; // 浊度 NTU
}

/** 饲料检测指标 */
export interface FeedMetrics {
  moisture?: number | null; // 水分 %
  mold?: boolean | null; // 是否霉变
  aflatoxin?: number | null; // 黄曲霉毒素 ppb
  protein?: number | null; // 粗蛋白 %
}

/** 环境表面检测指标 */
export interface SurfaceMetrics {
  bacteria?: number | null; // 菌落总数
  salmonella?: boolean | null; // 沙门氏菌
  dust?: number | null; // 粉尘
}

export type EnvironmentMetrics = AirMetrics | WaterMetrics | FeedMetrics | SurfaceMetrics;

export interface EnvironmentTest {
  id: string;
  userId: string;
  houseId?: string | null;
  category: EnvironmentCategory;
  metrics: EnvironmentMetrics;
  result: EnvironmentResult;
  note?: string | null;
  createdAt: string;
}

export interface CreateEnvironmentTestInput {
  houseId?: string | null;
  category: EnvironmentCategory;
  metrics: EnvironmentMetrics;
  note?: string | null;
}
