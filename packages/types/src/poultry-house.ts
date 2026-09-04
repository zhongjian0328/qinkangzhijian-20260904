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
  type: 'temperature' | 'humidity' | 'ammonia' | 'co2' | 'disease';
  severity: 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  createdAt: string;
}
