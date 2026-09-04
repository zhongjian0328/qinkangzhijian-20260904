export interface PoultryHouse {
  id: string;
  userId: string;
  name: string;
  capacity: number;
  currentCount: number;
  species: 'chicken' | 'duck' | 'goose' | 'turkey' | 'other';
  age: number;
  environment: EnvironmentSnapshot;
  alerts: Alert[];
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentSnapshot {
  temperature: number;
  humidity: number;
  ammonia?: number;
  co2?: number;
  ventilation: 'good' | 'moderate' | 'poor';
  timestamp: string;
}

export interface Alert {
  id: string;
  houseId?: string;
  type: 'temperature' | 'humidity' | 'ammonia' | 'co2' | 'disease';
  severity: 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface EnvironmentRecord {
  id: string;
  houseId: string;
  temperature: number;
  humidity: number;
  ammonia?: number | null;
  co2?: number | null;
  ventilation: 'good' | 'moderate' | 'poor';
  timestamp: string;
}
