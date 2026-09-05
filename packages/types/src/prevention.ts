export type PreventionStatus = 'active' | 'completed' | 'archived';

export type FollowUpStatus = 'pending' | 'completed';

export interface PreventionPlanContent {
  diagnosisSummary: string;
  emergencyMeasures: string[];
  greenMedication: string[];
  immunization: string[];
  biosafety: string[];
  monitoringPlan: string[];
  followUpNotes: string;
}

export interface FollowUp {
  id: string;
  planId: string;
  dayOffset: number;
  status: FollowUpStatus;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface PreventionPlan {
  id: string;
  userId: string;
  diagnosisId: string;
  content: PreventionPlanContent;
  status: PreventionStatus;
  followUps?: FollowUp[];
  diagnosis?: {
    disease?: string;
    severity?: string;
    createdAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}
