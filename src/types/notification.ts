import type { Id, ISODateTimeString } from './common';

export type NotificationType =
  // 시터가 케어 일지 등록 시 보호자에게
  | 'CARE_LOG'
  // 시터가 공고에 제안 등록 시 보호자에게
  | 'PROPOSAL_ARRIVED'
  // 보호자가 제안을 수락 → 시터에게 (예약 생성)
  | 'MATCHING_CONFIRMED'
  // 보호자가 시터에게 케어 신청 시 시터에게
  | 'REQUEST_RECEIVED'
  // 예약 확정 후 탈락한 다른 제안 시터들에게 자동 철회
  | 'PROPOSAL_WITHDRAWN'
  // 양측 결제 완료 → 보호자/시터 양쪽에게
  | 'PAYMENT_COMPLETED'
  // 관리자가 시터 프로필 승인 → 시터에게
  | 'SITTER_PROFILE_APPROVED'
  // 사용자/관리자가 예약을 실제 취소할 때 양쪽에게
  | 'RESERVATION_CANCELED'
  // 결제 제한 시간 초과로 예약 만료 → 양쪽에게
  | 'RESERVATION_EXPIRED'
  // 불가피한 사유 취소 요청이 들어와 관리자 검토 대기 — 상대방에게
  | 'CANCEL_REQUESTED'
  // 시터가 보호자의 돌봄 요청을 거절 → 보호자에게
  | 'REQUEST_REJECTED'
  // 시터가 보호자의 돌봄 요청을 수락 → 보호자에게 (예약 생성)
  | 'REQUEST_ACCEPTED';

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
