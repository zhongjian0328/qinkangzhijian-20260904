// AI兽医诊断（结构化专业诊断）类型 —— 对齐《AI兽医诊断功能开发文档_v2.md》

export interface CaseBasicInfo {
  species: string; // chicken/duck/goose/turkey/other
  breed: string;
  ageDays: number;
  stock: number;
  sickCount: number;
  deathCount: number;
  feedingMode: string;
  productionStage: string;
}

export interface CaseChiefComplaint {
  mainProblem: string;
  onsetTime: string;
  course: string; // 急性/亚急性/慢性
  progression: string;
  mortalityTrend: string;
  transmissionSpeed: string;
  pastHistory: string;
}

export interface CaseClinicalSymptoms {
  general: string[];
  digestive: string[];
  respiratory: string[];
  reproductive: string[];
  nervous: string[];
  skinMucosa: string[];
  motor: string[];
  other: string[];
  note?: string;
}

export interface CaseNecropsyLesions {
  subcutaneousMuscle: string[];
  digestive: string[];
  respiratory: string[];
  circulatory: string[];
  urinaryReproductive: string[];
  immuneOrgans: string[];
  nervous: string[];
  other: string[];
}

export interface CaseLabTests {
  serology: string[];
  pathogen: string[];
  bacteriology: string[];
  parasitology: string[];
  biochemistry: string[];
  cbc: string[];
}

export interface CaseImmuneHistory {
  program: string[];
  lastVaccine: string;
  postVaccineReaction: string;
  antibodyTest: string;
  vaccineFailureHistory: string;
}

export interface CaseMedicationHistory {
  recentDrugs: string[];
  effect: string;
  allergyHistory: string;
  healthProducts: string[];
  withdrawalPeriod: string;
}

export interface CaseEnvironment {
  temperature: string;
  humidity: string;
  ventilation: string;
  density: string;
  feed: string;
  water: string;
  light: string;
  weatherChange: string;
  humanTraffic: string;
  surroundingEpidemic: string;
  biosecurity: string;
}

export interface CaseEpidemiology {
  introductionHistory: string;
  vaccineSource: string;
  flockSource: string;
  mixedFarming: string;
  wildBirdContact: string;
  similarFarms: string;
  deadBirdDisposal: string;
}

export interface VetDiagnosisResult {
  disease: string; // 首要诊断
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  primary: { disease: string; confidence: number };
  secondaries: { disease: string; confidence: number }[];
  excluded: string[]; // 已排除疾病及原因
  evidence: string[]; // 诊断依据
  differentialTests: string[]; // 鉴别诊断建议（实验室检测）
  treatment: {
    emergency: string[];
    medication: string[];
    immunization: string[];
    disinfection: string[];
    management: string[];
  };
  followup: string[]; // 随访建议
  disclaimer: string;
  riskWarning: string | null; // 危重预警
}

export type VetCaseStatus =
  | 'draft'
  | 'submitted'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'offline';

export interface VetCase {
  id: string;
  caseNo: string;
  userId: string;
  status: VetCaseStatus;
  species: string;
  basicInfo: CaseBasicInfo | null;
  chiefComplaint: CaseChiefComplaint | null;
  clinicalSymptoms: CaseClinicalSymptoms | null;
  necropsyLesions: CaseNecropsyLesions | null;
  labTests: CaseLabTests | null;
  immuneHistory: CaseImmuneHistory | null;
  medicationHistory: CaseMedicationHistory | null;
  environment: CaseEnvironment | null;
  epidemiology: CaseEpidemiology | null;
  imageUrls: string[];
  diagnosisResult: VetDiagnosisResult | null;
  diagnosisEngine: string | null; // doubao_2_1_turbo / offline_rule
  confidence: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

// 离线规则引擎诊断结果（前端本地计算）
export interface OfflineDiagnosisResult {
  disease: string;
  confidence: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  zoonotic: boolean;
  category: string;
  matchedSymptoms: string[];
  missingKeySymptoms: string[];
  secondaries: { disease: string; confidence: number }[];
  treatment: string[];
  prevention: string[];
  warnings: string[];
}

// 症状/病变标签目录
export interface SymptomTag {
  category: string;
  name: string;
}

export interface SymptomTagCategory {
  key: string;
  label: string;
  tags: string[];
}

export interface LesionTagCategory {
  key: string;
  label: string;
  tags: string[];
}
