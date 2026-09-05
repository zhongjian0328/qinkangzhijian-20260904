export interface ConsultMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
  diagnosis?: ConsultDiagnosis | null;
  relatedDiseases?: string[];
  createdAt: string;
}

export interface ConsultDiagnosis {
  preliminaryDiagnosis: string;
  confidence: number;
  suggestions: string[];
  nextSteps: string;
}

export interface ConsultSession {
  id: string;
  userId: string;
  title: string;
  messages: ConsultMessage[];
  createdAt: string;
  updatedAt: string;
}

/** AI 对话问诊返回（对齐 PRD-v5 对话问诊提示词 2.0.2.1 输出结构） */
export interface ConsultReply {
  reply: string;
  preliminaryDiagnosis?: string | null;
  confidence?: number | null;
  suggestions?: string[] | null;
  nextSteps?: string | null;
  relatedDiseases?: string[] | null;
}
