import type { Id, ISODateTimeString } from './common';

export type NotificationType =
  | 'CARE_LOG'
  | 'PROPOSAL_ARRIVED'
  | 'MATCHING_CONFIRMED'
  | 'REQUEST_RECEIVED'
  | 'PROPOSAL_WITHDRAWN'
  | 'PAYMENT_COMPLETED';

export interface Notification {
  id: Id;
  receiverId: Id;
  senderId?: Id | null;
  type: NotificationType;
  message: string;
  referenceId?: Id | null;
  referenceType?: string | null;
  isRead?: boolean;
  read?: boolean;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
}

export interface UnreadNotificationCountResponse {
  count: number;
}
