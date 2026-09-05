import { api } from './client';
import {
  Certification,
  SubmitCertificationInput,
  ReviewCertificationInput,
} from '@qinkang/types';

export interface PendingCertification extends Certification {
  user?: { id: string; username: string; phone: string; role: string; subRole?: string | null };
}

export const certificationApi = {
  submit: (data: SubmitCertificationInput) => api.post<Certification>('/certification', data),
  mine: () => api.get<Certification | null>('/certification/mine'),
  pending: () => api.get<PendingCertification[]>('/certification/pending'),
  review: (id: string, data: ReviewCertificationInput) =>
    api.post<Certification>(`/certification/${id}/review`, data),
};
