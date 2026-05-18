import type { Id, ISODateTimeString, PageQuery, TimeString } from './common';
import type { PetSize, PetSpecies } from './pet';

export type PossiblePetType = PetSpecies | 'ALL';

export type PossiblePetSize = PetSize | 'ALL';

export type SitterProfileStatus = 'RESERVABLE' | 'NON_RESERVABLE';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface SitterProfileRequest {
  region: string;
  introduction: string;
  experienceYears: number;
  possiblePetType: PossiblePetType;
  possiblePetSize: PossiblePetSize;
  pricePerHour: number;
}

export interface SitterProfile extends SitterProfileRequest {
  id: Id;
  memberId: Id;
  status: SitterProfileStatus;
  reservationStatus?: SitterProfileStatus;
  createdAt?: ISODateTimeString;
}

export interface SitterSearchQuery extends PageQuery {
  region?: string;
  possiblePetType?: PossiblePetType;
  possiblePetSize?: PossiblePetSize;
  minPrice?: number;
  maxPrice?: number;
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
