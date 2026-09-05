import { api } from './client';
import {
  ExamPaper,
  CreateExamPaperInput,
  UpdateExamPaperInput,
} from '@qinkang/types';

export const examPaperApi = {
  list: () => api.get<ExamPaper[]>('/exam-paper'),
  detail: (id: string) => api.get<ExamPaper & { questions: any[] }>(`/exam-paper/${id}`),
  create: (data: CreateExamPaperInput) => api.post<ExamPaper>('/exam-paper', data),
  compose: (data: { title: string; chapter?: string; difficulty?: string; count?: number; duration?: number }) =>
    api.post<ExamPaper>('/exam-paper/compose', data),
  update: (id: string, data: UpdateExamPaperInput) => api.patch<ExamPaper>(`/exam-paper/${id}`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/exam-paper/${id}`),
};
