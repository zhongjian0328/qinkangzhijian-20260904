import { api } from './client';
import { Question, ExamRecord, InternLog, SubmitExamInput, CreateInternLogInput } from '@qinkang/types';

export interface ExamSubmitResult {
  record: ExamRecord;
  correctCount: number;
  total: number;
  score: number;
  totalScore: number;
}

export const learningApi = {
  questions: (params?: { chapter?: string; type?: string; difficulty?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.chapter) qs.set('chapter', params.chapter);
    if (params?.type) qs.set('type', params.type);
    if (params?.difficulty) qs.set('difficulty', params.difficulty);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return api.get<Question[]>(`/learning/questions${query ? `?${query}` : ''}`);
  },
  submitExam: (data: SubmitExamInput) => api.post<ExamSubmitResult>('/learning/exams', data),
  examRecords: () => api.get<ExamRecord[]>('/learning/exam-records'),

  internLogs: () => api.get<InternLog[]>('/learning/intern-logs'),
  createInternLog: (data: CreateInternLogInput) =>
    api.post<InternLog>('/learning/intern-logs', data),
  internLog: (id: string) => api.get<InternLog>(`/learning/intern-logs/${id}`),
  reviewInternLog: (id: string, comment: string) =>
    api.post<InternLog>(`/learning/intern-logs/${id}/review`, { comment }),
};
