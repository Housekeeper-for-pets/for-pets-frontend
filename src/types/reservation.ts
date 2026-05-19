import type {
  CareType,
  Id,
  ISODateTimeString,
  PageQuery,
  TimeSlotResponse,
} from './common';
import type { PetSnapshot } from './pet';

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'EXPIRED';

export type ReservationSource = 'CARE_REQUEST' | 'PROPOSAL';

export type CancelCategory = 'PERSONAL' | 'SCHEDULE_CHANGE' | 'UNAVOIDABLE' | 'OTHER';

export type CanceledBy = 'GUARDIAN' | 'SITTER';

export interface ReservationSearchQuery extends PageQuery {
  status?: ReservationStatus;
}

export interface Reservation {
  id: Id;
  guardianId: Id;
  sitterMemberId?: Id;
  sitterProfileId: Id;
  careType: CareType;
  status: ReservationStatus;
  source: ReservationSource;
  guardianPaid?: boolean;
  sitterPaid?: boolean;
  cancelReason?: string | null;
  cancelCategory?: CancelCategory | null;
  canceledBy?: CanceledBy | null;
  pets: PetSnapshot[];
  timeSlots: TimeSlotResponse[];
  confirmedAt?: ISODateTimeString | null;
  completedAt?: ISODateTimeString | null;
  canceledAt?: ISODateTimeString | null;
  expiredAt?: ISODateTimeString | null;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface CancelReservationRequest {
  cancelReason: string;
  cancelCategory: CancelCategory;
}
