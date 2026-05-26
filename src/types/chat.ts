import type { Id, ISODateTimeString } from './common';

export type ChatMessageType = 'TEXT' | 'SYSTEM';

export interface ChatRoomCreateRequest {
  opponentId: Id;
}

export interface ChatRoomCreateResponse {
  chatRoomId: Id;
  opponentId: Id;
  opponentNickname: string;
  isNew: boolean;
}

export interface ChatRoomListItem {
  chatRoomId: Id;
  opponentId: Id;
  opponentNickname: string;
  lastMessage?: string | null;
  lastMessageType?: ChatMessageType | null;
  lastMessageAt?: ISODateTimeString | null;
  unreadCount: number;
}

export interface ChatRoomListResponse {
  items: ChatRoomListItem[];
  hasNext: boolean;
  nextCursorLastMessageAt?: ISODateTimeString | null;
  nextCursorChatRoomId?: Id | null;
}

export interface ChatMessageItem {
  messageId: Id;
  messageType: ChatMessageType;
  senderId: Id;
  senderNickname: string;
  content: string;
  createdAt: ISODateTimeString;
  isMine: boolean;
  isReadByOpponent: boolean;
}

export interface ChatMessageListResponse {
  items: ChatMessageItem[];
  hasNext: boolean;
  nextCursorId?: Id | null;
}

export interface ChatRoomLeaveResponse {
  chatRoomId: Id;
  isLeft: boolean;
  leftAt: ISODateTimeString;
  visibleFromAt: ISODateTimeString;
}

export interface ChatMessageBroadcast {
  chatRoomId: Id;
  messageId: Id;
  messageType: ChatMessageType;
  senderId: Id;
  senderNickname: string;
  content: string;
  createdAt: ISODateTimeString;
}
