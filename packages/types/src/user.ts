export type MainRole = 'admin' | 'farmer' | 'vet' | 'technician' | 'institution' | 'student';

export type SubRole =
  | 'small'        // 小散户
  | 'cooperative'  // 合作社
  | 'enterprise'   // 养殖企业
  | 'cdc'          // 疫控
  | 'research'     // 科研
  | 'service'      // 服务商
  | 'teacher'      // 教师
  | 'learning'     // 学生-学习
  | 'cognitive'    // 学生-认知实习
  | 'internship';  // 学生-实习

export interface User {
  id: string;
  username: string;
  phone: string;
  email?: string;
  role: MainRole;
  subRole?: SubRole | null;
  farmId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  phone: string;
  password: string;
  role?: MainRole;
  subRole?: SubRole | null;
  farmName?: string;
}
