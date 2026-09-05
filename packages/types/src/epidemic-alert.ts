export type EpidemicAlertLevel = 'general' | 'major' | 'severe';
export type EpidemicAlertStatus = 'active' | 'resolved';

export interface EpidemicAlert {
  id: string;
  userId: string;
  title: string;
  disease: string;
  level: EpidemicAlertLevel;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  content: string;
  audience: string[];
  status: EpidemicAlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpidemicAlertInput {
  title: string;
  disease: string;
  level?: EpidemicAlertLevel;
  province?: string;
  city?: string;
  district?: string;
  content: string;
  audience?: string[];
  status?: EpidemicAlertStatus;
}

export interface UpdateEpidemicAlertInput {
  title?: string;
  disease?: string;
  level?: EpidemicAlertLevel;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  content?: string;
  audience?: string[];
  status?: EpidemicAlertStatus;
}
