import type { Id, ISODateTimeString } from './common';

export type MemberGender = 'MALE' | 'FEMALE';

export type MemberRole = 'MEMBER' | 'SITTER' | 'ADMIN';

export type MemberStatus = 'ACTIVE' | 'SUSPENDED';

export type Region =
  | 'UNKNOWN'
  | 'GANGNAM'
  | 'SEOCHO'
  | 'SONGPA'
  | 'GANGDONG'
  | 'GWANGJIN'
  | 'SEONGDONG'
  | 'YONGSAN'
  | 'JUNG'
  | 'JONGNO'
  | 'SEODAEMUN'
  | 'MAPO'
  | 'EUNPYEONG'
  | 'YANGCHEON'
  | 'GANGSEO'
  | 'GURO'
  | 'GEUMCHEON'
  | 'YEONGDEUNGPO'
  | 'DONGJAK'
  | 'GWANAK'
  | 'DOBONG'
  | 'GANGBUK'
  | 'NOWON'
  | 'SEONGBUK'
  | 'DONGDAEMUN'
  | 'JUNGNANG';

// 회원 API에서 반환하는 내 정보 타입입니다.
export interface Member {
  id: Id;
  email: string;
  nickname: string;
  phone?: string;
  gender?: MemberGender;
  region?: Region;
  role: MemberRole;
  status: MemberStatus;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface UpdateMemberRequest {
  nickname: string;
  phone?: string;
  gender?: MemberGender;
  region?: Region;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
