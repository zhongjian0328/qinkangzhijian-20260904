import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { User } from '@qinkang/types';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (username: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isHydrated: true });
        return;
      }

      api.setToken(token);
      set({ token, isHydrated: true });

      try {
        const user = await authApi.getMe();
        set({ user });
      } catch {
        // 本地 token 失效，清掉
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        api.clearToken();
        set({ token: null, user: null });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  login: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ phone, password });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, res.refreshToken);
      api.setToken(res.token);
      set({ user: res.user, token: res.token });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username: string, phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ username, phone, password });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, res.refreshToken);
      api.setToken(res.token);
      set({ user: res.user, token: res.token });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    api.clearToken();
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user });
    } catch {
      // Token expired, clear auth state
      api.clearToken();
      set({ user: null, token: null });
    }
  },
}));