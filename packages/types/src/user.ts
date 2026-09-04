export interface User {
  id: string;
  username: string;
  phone: string;
  email?: string;
  role: 'admin' | 'farmer' | 'vet' | 'technician';
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
  farmName?: string;
}
