import type {
  CareType,
  Id,
  ISODateTimeString,
  TimeSlotRequest,
  TimeSlotResponse,
} from './common';
import type { PetSnapshot } from './pet';

export type CareRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export interface CareRequestCreateRequest {
  petIds: Id[];
  careType: CareType;
  requestPrice: number;
  message?: string;
  timeSlots: TimeSlotRequest[];
}

export interface CareRequest {
  id: Id;
  memberId: Id;
  sitterProfileId: Id;
  careType: CareType;
  requestPrice: number;
  message?: string;
  status: CareRequestStatus;
  pets: PetSnapshot[];
  timeSlots: TimeSlotResponse[];
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}
