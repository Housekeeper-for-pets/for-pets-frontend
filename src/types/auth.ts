import type { MemberRole } from './member';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

export interface SignupResponse {
  id: number;
  email: string;
  name: string;
  role: MemberRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ReissueTokenRequest {
  refreshToken: string;
}
