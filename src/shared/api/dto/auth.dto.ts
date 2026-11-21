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

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
  expiresAtUtc?: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roles?: string[];
}
