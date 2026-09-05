export type CourseStatus = 'draft' | 'published';

export interface CourseChapter {
  title: string;
  content: string;
}

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  subject?: string | null;
  description?: string | null;
  chapters: CourseChapter[];
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  teacherName?: string;
}

export interface CourseProgress {
  id: string;
  courseId: string;
  userId: string;
  progress: number;
  completedChapters: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  subject?: string;
  description?: string;
  chapters?: CourseChapter[];
  status?: CourseStatus;
}

export interface UpdateCourseInput {
  title?: string;
  subject?: string | null;
  description?: string | null;
  chapters?: CourseChapter[];
  status?: CourseStatus;
}

export interface UpdateCourseProgressInput {
  progress?: number;
  completedChapters?: number[];
}
