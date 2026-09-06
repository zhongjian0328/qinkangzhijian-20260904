export type QuestionType = 'single' | 'multiple' | 'judge';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExamType = 'practice' | 'mock';
export type InternLogStatus = 'submitted' | 'reviewed';

export interface Question {
  id: string;
  type: QuestionType;
  chapter?: string | null;
  difficulty: Difficulty;
  question: string;
  options: string[];
  answer: number[];
  explanation?: string | null;
  createdAt: string;
}

export interface ExamRecord {
  id: string;
  userId: string;
  type: ExamType;
  chapter?: string | null;
  totalScore: number;
  score: number;
  answers: string;
  createdAt: string;
}

export interface InternLog {
  id: string;
  userId: string;
  title: string;
  content: string;
  images?: string[] | null;
  studentDiagnosis?: string | null;
  mentorComment?: string | null;
  mentorId?: string | null;
  status: InternLogStatus;
  logDate: string;
  createdAt: string;
  studentName?: string | null;
}

export interface SubmitExamInput {
  chapter?: string | null;
  answers: { questionId: string; selected: number[] }[];
}

export interface CreateInternLogInput {
  title: string;
  content: string;
  logDate: string;
  images?: string[];
  studentDiagnosis?: string;
}

// 图谱百科
export interface AtlasFigure {
  text: string;
  image: string; // /atlas/figX-YYY.jpg
}

export interface AtlasDisease {
  title: string;
  figures: AtlasFigure[];
}

export interface Atlas {
  id: string;
  name: string;
  diseases: AtlasDisease[];
}

export interface AtlasIndex {
  atlases: Atlas[];
  total: number;
}

// 养鸡知识库
export interface FarmingCategory {
  id: string;
  name: string;
  count: number;
  articles: { id: string; title: string; excerpt: string }[];
}

export interface FarmingIndex {
  total: number;
  categories: FarmingCategory[];
}

export interface FarmingArticle {
  id: string;
  categoryId: string;
  category: string;
  title: string;
  content: string;
}

export interface KnowledgeStats {
  disease_count: number;
  figure_count: number;
  tip_count: number;
  categories: FarmingCategory[];
}
