import type { Id } from './common';
import type { ReservationStatus } from './reservation';

export type PaymentRole = 'GUARDIAN' | 'SITTER';

export type PaymentProvider = 'PORTONE';

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
  merchantUid: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
}

export interface ConfirmPaymentRequest {
  merchantUid: string;
}

export interface ConfirmPaymentResponse {
  paymentId: Id;
  status: PaymentStatus;
  reservationStatus: ReservationStatus;
}
