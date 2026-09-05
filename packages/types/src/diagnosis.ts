export interface Diagnosis {
  id: string;
  userId: string;
  imageUrls: string[];
  species: 'chicken' | 'duck' | 'goose' | 'turkey' | 'other';
  symptoms: string[];
  environmentData?: EnvironmentData;
  aiResult: AIResult;
  confidence: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AIResult {
  disease: string;
  probability: number;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  differentialDiagnoses: DifferentialDiagnosis[];
  figures: FigureNote[];
}

export interface FigureNote {
  title: string;
  text: string;
}

export interface DifferentialDiagnosis {
  disease: string;
  probability: number;
}

export interface EnvironmentData {
  temperature?: number;
  humidity?: number;
  ammonia?: number;
  co2?: number;
  ventilation?: 'good' | 'moderate' | 'poor';
}

export type Species = 'chicken' | 'duck' | 'goose' | 'turkey' | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
