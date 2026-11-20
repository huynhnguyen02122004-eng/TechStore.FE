import axios from 'axios';
import { httpClient } from '../httpClient';
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../dto/auth.dto';

export type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../dto/auth.dto';

export function saveAuthSession(response: AuthResponse, rememberMe: boolean) {
  const storage = rememberMe ? localStorage : sessionStorage;
  const previousStorage = rememberMe ? sessionStorage : localStorage;

  storage.setItem('accessToken', response.accessToken);
  storage.setItem('user', JSON.stringify(response.user));
  previousStorage.removeItem('accessToken');
  previousStorage.removeItem('user');
}

export function getSignedInUserName(): string | null {
  const storage = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage;
  const savedUser = storage.getItem('user');
  if (!storage.getItem('accessToken') || !savedUser) return null;

  try {
    const user = JSON.parse(savedUser) as Partial<AuthResponse['user']> | null;
    return typeof user?.fullName === 'string' ? user.fullName.trim() || null : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem('accessToken');
    storage.removeItem('user');
  }
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export async function retryWithRefreshedSession<T>(token: string, request: (token: string) => Promise<T>): Promise<T> {
  try {
    return await request(token);
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  }

  const storage = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage;
  const currentToken = storage.getItem('accessToken');
  if (currentToken && currentToken !== token) return request(currentToken);

  const { data } = await httpClient.post<AuthResponse>('/auth/refresh');
  if (storage.getItem('accessToken') === token) saveAuthSession(data, storage === localStorage);
  return request(data.accessToken);
}

// 4. Định nghĩa authService
export const authService = {
  getCurrentUser: async (token: string): Promise<UserProfile> => {
    const response = await httpClient.get<UserProfile>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await httpClient.post('/auth/register', data);
    return response.data;
  },
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await httpClient.post('/auth/login', data);
    return response.data;
  },
  logout: async (token: string): Promise<void> => {
    await httpClient.post('/auth/logout', undefined, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
