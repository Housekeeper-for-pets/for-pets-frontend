import type { Id, ISODateTimeString } from './common';
import type { ReservationStatus } from './reservation';

export type PaymentRole = 'GUARDIAN' | 'SITTER';

export type PaymentProvider = 'PORTONE';

export type PaymentType = 'RESERVATION_PAYMENT' | 'REFUND' | string;

export type PaymentStatus =
  | 'READY'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELED'
  | 'REFUNDED'
  | 'EXPIRED';

export interface CreatePaymentRequest {
  reservationId: Id;
  paymentRole: PaymentRole;
}

export interface PaymentResponse {
  paymentId: Id;
  reservationId: Id;
  memberId?: Id;
  paymentRole: PaymentRole;
  paymentType?: PaymentType;
  merchantUid: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  userCouponId?: Id | null;
  provider: PaymentProvider;
  status: PaymentStatus;
  requestedAt?: ISODateTimeString | null;
  approvedAt?: ISODateTimeString | null;
  canceledAt?: ISODateTimeString | null;
  refundedAt?: ISODateTimeString | null;
}

export interface ConfirmPaymentRequest {
  merchantUid: string;
}

export interface ConfirmPaymentResponse {
  paymentId: Id;
  status: PaymentStatus;
  reservationStatus: ReservationStatus;
}

export interface FailPaymentRequest {
  merchantUid: string;
  failedReason: string;
}
