export type CertificationType = 'farmer' | 'vet' | 'merchant' | 'institution' | 'student';
export type CertificationStatus = 'pending' | 'approved' | 'rejected';

export interface Certification {
  id: string;
  userId: string;
  type: CertificationType;
  data: Record<string, string>;
  images: string[];
  status: CertificationStatus;
  reviewerNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitCertificationInput {
  type: CertificationType;
  data: Record<string, string>;
  images?: string[];
}

export interface ReviewCertificationInput {
  status: 'approved' | 'rejected';
  reviewerNote?: string;
}
