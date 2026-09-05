export type EpidemiologyStatus = 'investigating' | 'processing' | 'completed';

export interface Epidemiology {
  id: string;
  userId: string;
  title: string;
  disease: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  source?: string | null;
  transmissionChain?: string | null;
  zones?: { point?: string; infectedArea?: string; threatenedArea?: string } | null;
  measures: string[];
  status: EpidemiologyStatus;
  conclusion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpidemiologyInput {
  title: string;
  disease: string;
  province?: string;
  city?: string;
  district?: string;
  source?: string;
  transmissionChain?: string;
  zones?: { point?: string; infectedArea?: string; threatenedArea?: string };
  measures?: string[];
  status?: EpidemiologyStatus;
  conclusion?: string;
}

export interface UpdateEpidemiologyInput {
  title?: string;
  disease?: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  source?: string | null;
  transmissionChain?: string | null;
  zones?: { point?: string; infectedArea?: string; threatenedArea?: string } | null;
  measures?: string[];
  status?: EpidemiologyStatus;
  conclusion?: string | null;
}
