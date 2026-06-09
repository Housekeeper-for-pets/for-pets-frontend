import type { Id, ISODateTimeString, PageQuery, TimeString } from './common';
import type { MemberGender, Region } from './member';
import type { PetSize, PetSpecies } from './pet';

export type PossiblePetType = PetSpecies | 'ALL';

export type PossiblePetSize = PetSize | 'ALL';

export type SitterProfileStatus = 'RESERVABLE' | 'NON_RESERVABLE';

export type SitterApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface SitterProfileRequest {
  introduction?: string;
  experienceYears: number;
  possiblePetType: PossiblePetType;
  possiblePetSize: PossiblePetSize;
  pricePerHour: number;
}

export interface SitterProfile {
  id: Id;
  memberId: Id;
  region: Region;
  introduction?: string;
  experienceYears: number;
  possiblePetType: PossiblePetType;
  possiblePetSize: PossiblePetSize;
  pricePerHour: number;
  averageRating?: number | string | null;
  reviewCount?: number;
  status: SitterProfileStatus;
  approvalStatus?: SitterApprovalStatus;
  schedules: SitterSchedule[];
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface UpdateSitterProfileRequest extends SitterProfileRequest {
  region: Region;
}

export interface SitterSearchQuery extends PageQuery {
  region?: Region;
  possiblePetType?: PossiblePetType;
  possiblePetSize?: PossiblePetSize;
  minPrice?: number;
  maxPrice?: number;
  direction?: 'asc' | 'desc';
}

export interface UpdateSitterStatusRequest {
  status: SitterProfileStatus;
}

export interface SitterScheduleRequest {
  dayOfWeek: DayOfWeek;
  startTime: TimeString;
  endTime: TimeString;
}

export interface ReplaceSitterSchedulesRequest {
  schedules: SitterScheduleRequest[];
}

export interface SitterSchedule extends SitterScheduleRequest {
  id: Id;
}

export interface AdminSitterProfile {
  id: Id;
  memberId: Id;
  region: Region;
  introduction?: string;
  experienceYears: number;
  possiblePetType: PossiblePetType;
  possiblePetSize: PossiblePetSize;
  pricePerHour: number;
  status: SitterProfileStatus;
  approvalStatus: SitterApprovalStatus;
  rejectReason?: string | null;
  evaluatedBy?: Id | null;
  evaluatedAt?: ISODateTimeString | null;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface RejectSitterRequest {
  rejectReason: string;
}

// 관리자 시터 상세 — 시터 프로필 + 신청자 회원 정보가 한 번에 옵니다.
export interface AdminSitterDetail {
  // Sitter Profile
  sitterProfileId: Id;
  introduction?: string | null;
  experienceYears: number;
  possiblePetType: PossiblePetType;
  possiblePetSize: PossiblePetSize;
  pricePerHour: number;
  status: SitterProfileStatus;
  approvalStatus: SitterApprovalStatus;
  rejectReason?: string | null;
  evaluatedBy?: Id | null;
  evaluatedAt?: ISODateTimeString | null;
  profileCreatedAt?: ISODateTimeString;
  profileUpdatedAt?: ISODateTimeString;
  // Member (신청자)
  memberId: Id;
  email: string;
  nickname: string;
  phone: string;
  region: Region;
  gender?: MemberGender;
  memberCreatedAt?: ISODateTimeString;
}
