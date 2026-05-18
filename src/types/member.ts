import type { Id, ISODateTimeString } from './common';

export type MemberGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export type MemberRole = 'MEMBER' | 'SITTER' | 'ADMIN';

export type MemberStatus = 'ACTIVE' | 'SUSPENDED';

// 회원 API에서 반환하는 내 정보 타입입니다.
export interface Member {
  id: Id;
  email: string;
  name: string;
  phoneNumber: string;
  role: MemberRole;
  createdAt?: ISODateTimeString;
}

export interface UpdateMemberRequest {
  name: string;
  phoneNumber: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
