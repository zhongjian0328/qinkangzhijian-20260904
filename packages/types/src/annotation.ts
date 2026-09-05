export type AnnotationStatus = 'pending' | 'verified' | 'special';

export interface Annotation {
  id: string;
  userId: string;
  title: string;
  imageUrl?: string | null;
  symptoms: string[];
  labels: string[];
  disease: string;
  note?: string | null;
  status: AnnotationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnotationInput {
  title: string;
  imageUrl?: string | null;
  symptoms?: string[];
  labels?: string[];
  disease: string;
  note?: string | null;
  status?: AnnotationStatus;
}

export interface UpdateAnnotationInput {
  title?: string;
  imageUrl?: string | null;
  symptoms?: string[];
  labels?: string[];
  disease?: string;
  note?: string | null;
  status?: AnnotationStatus;
}
