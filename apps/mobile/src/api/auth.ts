import { api } from './client';
import { LoginRequest, RegisterRequest, LoginResponse, User } from '@qinkang/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<LoginResponse>('/auth/register', data),
  refreshToken: (refreshToken: string) =>
    api.post<{ token: string }>('/auth/refresh', { refreshToken }),
  getMe: () => api.get<User>('/user/me'),
};
