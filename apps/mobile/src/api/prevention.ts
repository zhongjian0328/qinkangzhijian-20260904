import { api } from './client';
import { PreventionPlan, FollowUp } from '@qinkang/types';

export const preventionApi = {
  generate: (diagnosisId: string) =>
    api.post<PreventionPlan>('/prevention/generate', { diagnosisId }),
  list: () => api.get<PreventionPlan[]>('/prevention'),
  getByDiagnosis: (diagnosisId: string) =>
    api.get<PreventionPlan>(`/prevention/${diagnosisId}`),
  addFollowup: (planId: string, data: { dayOffset: number; status: string; notes?: string }) =>
    api.post<FollowUp>(`/prevention/${planId}/followup`, data),
  listFollowups: (planId: string) =>
    api.get<FollowUp[]>(`/prevention/${planId}/followups`),
};
