export type MainRole = 'admin' | 'farmer' | 'vet' | 'technician' | 'merchant' | 'institution' | 'student';

export type SubRole =
  | 'small'        // 养殖户-小散户/个体养殖户
  | 'cooperative'  // 养殖户-合作社
  | 'enterprise'   // 养殖户-养殖企业
  | 'service'      // 兽医服务商
  | 'medicine'     // 商家-兽药商
  | 'equipment'    // 商家-设备商
  | 'cdc'          // 机构-疫控机构
  | 'research'     // 机构-科研院所
  | 'teacher'      // 机构-教师/导师
  | 'learning'     // 学生-学习阶段
  | 'cognitive'    // 学生-认知实习
  | 'internship';  // 学生-顶岗实习

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
