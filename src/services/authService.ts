import axios from 'axios';

// 1. Định nghĩa Interface cho dữ liệu gửi lên (DTO RegisterRequest & LoginRequest)
export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// 2. Định nghĩa Interface cho dữ liệu trả về từ Backend
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
}

// 3. Khởi tạo cấu hình kết nối Axios tới Backend .NET
const API_URL = 'http://localhost:5091/api/v1';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 4. Định nghĩa authService
export const authService = {
  getCurrentUser: async (token: string): Promise<UserProfile> => {
    const response = await axiosInstance.get<UserProfile>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },
};