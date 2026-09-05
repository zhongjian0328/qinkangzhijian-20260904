import { api } from './client';
import { AtlasIndex } from '@qinkang/types';

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  excerpt: string;
}

export interface FigureNote {
  title: string;
  text: string;
}

export interface ChapterDetail {
  id: string;
  title: string;
  text: string;
  figures: FigureNote[];
}

export const knowledgeApi = {
  searchDisease: (query: string, topK = 10) =>
    api.post<{ total: number; results: KnowledgeSearchResult[] }>('/knowledge/search', {
      query,
      topK,
    }),
  searchFarming: (query: string, topK = 10) =>
    api.post<{ total: number; results: KnowledgeSearchResult[] }>('/knowledge/farming/search', {
      query,
      topK,
    }),
  figures: (disease: string) =>
    api.get<{ total: number; results: FigureNote[] }>('/knowledge/figures', {
      params: { disease },
    }),
  chapter: (id: string) => api.get<ChapterDetail>(`/knowledge/chapter/${id}`),
  atlas: () => api.get<AtlasIndex>('/knowledge/atlas'),
};
