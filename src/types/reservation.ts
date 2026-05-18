import type {
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

export type PaymentStatus = 'WAITING_GUARDIAN' | 'WAITING_SITTER' | 'BOTH_PAID';

export type CancelCategory = 'PERSONAL' | 'SCHEDULE_CHANGE' | 'EMERGENCY' | 'OTHER';

export type CanceledBy = 'GUARDIAN' | 'SITTER';

export interface ReservationSearchQuery extends PageQuery {
  status?: ReservationStatus;
}

export interface Reservation {
  id: Id;
  guardianId: Id;
  sitterId: Id;
  status: ReservationStatus;
  guardianPaid?: boolean;
  sitterPaid?: boolean;
  paymentStatus?: PaymentStatus;
  cancelReason?: string | null;
  cancelCategory?: CancelCategory | null;
  canceledBy?: CanceledBy | null;
  pets: PetSnapshot[];
  timeSlots: TimeSlotResponse[];
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface ReservationStatusResponse {
  id: Id;
  status: ReservationStatus;
  guardianPaid?: boolean;
  sitterPaid?: boolean;
  confirmedAt?: ISODateTimeString;
  completedAt?: ISODateTimeString;
}

export interface CancelReservationRequest {
  cancelReason: string;
  cancelCategory: CancelCategory;
}

export interface CancelReservationResponse {
  id: Id;
  status: 'CANCELED';
  cancelReason: string;
  cancelCategory: CancelCategory;
  canceledBy: CanceledBy;
  canceledAt: ISODateTimeString;
}
