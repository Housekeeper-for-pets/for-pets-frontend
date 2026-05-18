import type {
  Id,
  ISODateTimeString,
  TimeSlotRequest,
  TimeSlotResponse,
} from './common';
import type { PetSnapshot } from './pet';

export type CareRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export interface CareRequestCreateRequest {
  message: string;
  petIds: Id[];
  timeSlots: TimeSlotRequest[];
}

export interface CareRequest {
  id: Id;
  guardianId: Id;
  sitterId: Id;
  message: string;
  status: CareRequestStatus;
  pets: PetSnapshot[];
  timeSlots: TimeSlotResponse[];
  createdAt?: ISODateTimeString;
}
