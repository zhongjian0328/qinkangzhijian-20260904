export type PolicyCategory = 'prevention_plan' | 'immunization' | 'medication' | 'notice' | 'other';
export type PolicyStatus = 'draft' | 'published' | 'archived';

export interface Policy {
  id: string;
  userId: string;
  title: string;
  category: PolicyCategory;
  content: string;
  audience: string[]; // 定向推送目标角色（空数组 = 全体角色）
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
  readCount?: number; // 已读人数（机构统计时返回）
  read?: boolean; // 当前用户是否已读
}

export interface CreatePolicyInput {
  title: string;
  category?: PolicyCategory;
  content: string;
  audience?: string[]; // 目标角色（空 = 全体）
}

export interface UpdatePolicyInput {
  title?: string;
  category?: PolicyCategory;
  content?: string;
  audience?: string[];
  status?: PolicyStatus;
}

export interface PolicyStats {
  id: string;
  title: string;
  category: PolicyCategory;
  status: PolicyStatus;
  readCount: number;
  createdAt: string;
}
