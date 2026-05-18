import type { MemberGender, MemberRole, MemberStatus, Region } from './member';
import type { ISODateTimeString } from './common';

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  phone?: string;
  gender?: MemberGender;
  region?: Region;
}

export interface SignupResponse {
  id: number;
  email: string;
  nickname: string;
  role: MemberRole;
  status: MemberStatus;
  region?: Region;
  createdAt: ISODateTimeString;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface ReissueTokenRequest {
  refreshToken: string;
}
