import type { Id, ISODateTimeString, PageQuery, TimeString } from './common';
import type { Region } from './member';
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
  status: SitterProfileStatus;
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
