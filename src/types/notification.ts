import type { Id, ISODateTimeString } from './common';

export type NotificationType =
  | 'CARE_LOG'
  | 'PROPOSAL_ARRIVED'
  | 'MATCHING_CONFIRMED'
  | 'REQUEST_RECEIVED'
  | 'PROPOSAL_WITHDRAWN'
  | 'PAYMENT_COMPLETED'
  // 예약 취소 완료(상대방 또는 본인) 알림 — 예약 상세에서 취소 사유 확인 가능
  | 'RESERVATION_CANCELED'
  // 불가피한 사유로 인한 예약 취소 요청 알림 — 관리자 검토 대기 안내
  | 'CANCEL_REQUESTED';

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
