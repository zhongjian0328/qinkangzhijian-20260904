import { api } from './client';
import { Certification, SubmitCertificationInput } from '@qinkang/types';

export const certificationApi = {
  submit: (data: SubmitCertificationInput) => api.post<Certification>('/certification', data),
  mine: () => api.get<Certification | null>('/certification/mine'),
};
