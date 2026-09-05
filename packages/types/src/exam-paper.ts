export type ExamPaperStatus = 'draft' | 'published' | 'archived';

export interface ExamPaper {
  id: string;
  teacherId: string;
  title: string;
  chapter?: string | null;
  description?: string | null;
  questionIds: string[];
  totalScore: number;
  questionCount: number;
  duration?: number | null;
  status: ExamPaperStatus;
  createdAt: string;
  updatedAt: string;
  teacherName?: string;
}

export interface CreateExamPaperInput {
  title: string;
  chapter?: string;
  description?: string;
  questionIds: string[];
  totalScore?: number;
  duration?: number;
  status?: ExamPaperStatus;
}

export interface UpdateExamPaperInput {
  title?: string;
  chapter?: string | null;
  description?: string | null;
  questionIds?: string[];
  totalScore?: number;
  duration?: number | null;
  status?: ExamPaperStatus;
}
