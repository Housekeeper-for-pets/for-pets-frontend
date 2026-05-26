import type { Id, ISODateTimeString } from './common';

export type SettlementType =
  | 'CARE_COMPLETION'
  | 'SITTER_CANCEL_PENALTY'
  | 'OWNER_CANCEL_PENALTY';

export type SettlementStatus =
  | 'READY'
  | 'HOLD'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED';

export interface Settlement {
  settlementId: Id;
  reservationId: Id;
  receiverMemberId: Id;
  sourcePaymentId: Id;
  settlementType: SettlementType;
  status: SettlementStatus;
  originalAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  settlementAmount: number;
  reason?: string | null;
  holdReason?: string | null;
  failedReason?: string | null;
  requestedAt?: ISODateTimeString | null;
  approvedAt?: ISODateTimeString | null;
  processedAt?: ISODateTimeString | null;
  settledAt?: ISODateTimeString | null;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}
