import { api } from './client';
import {
  Course,
  CourseProgress,
  CreateCourseInput,
  UpdateCourseInput,
  UpdateCourseProgressInput,
} from '@qinkang/types';

export const courseApi = {
  list: () => api.get<Course[]>('/course'),
  myProgress: () => api.get<CourseProgress[]>('/course/my-progress'),
  detail: (id: string) => api.get<Course>(`/course/${id}`),
  create: (data: CreateCourseInput) => api.post<Course>('/course', data),
  update: (id: string, data: UpdateCourseInput) => api.patch<Course>(`/course/${id}`, data),
  updateProgress: (id: string, data: UpdateCourseProgressInput) =>
    api.post<CourseProgress>(`/course/${id}/progress`, data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/course/${id}`),
};
