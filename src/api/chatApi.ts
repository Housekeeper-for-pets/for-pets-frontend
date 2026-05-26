import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  ChatMessageListResponse,
  ChatRoomCreateRequest,
  ChatRoomCreateResponse,
  ChatRoomLeaveResponse,
  ChatRoomListResponse,
  Id,
  ISODateTimeString,
} from '../types';

export interface ChatRoomListQuery {
  cursorLastMessageAt?: ISODateTimeString;
  cursorChatRoomId?: Id;
  size?: number;
}

export interface ChatMessageListQuery {
  cursorId?: Id;
  size?: number;
}

// 상대 회원 ID로 채팅방을 생성하거나 기존 채팅방을 반환받습니다.
export const createOrGetChatRoom = async (request: ChatRoomCreateRequest) => {
  const response = await axiosInstance.post<ApiResponse<ChatRoomCreateResponse>>(
    '/chat-rooms',
    request,
  );

  return response.data;
};

// 참여 중인 채팅방 목록을 커서 방식으로 조회합니다.
export const getChatRooms = async (query?: ChatRoomListQuery) => {
  const response = await axiosInstance.get<ApiResponse<ChatRoomListResponse>>(
    '/chat-rooms',
    { params: query },
  );

  return response.data;
};

// 채팅방의 메시지 목록을 커서 방식으로 조회합니다.
export const getChatMessages = async (
  chatRoomId: Id,
  query?: ChatMessageListQuery,
) => {
  const response = await axiosInstance.get<ApiResponse<ChatMessageListResponse>>(
    `/chat-rooms/${chatRoomId}/messages`,
    { params: query },
  );

  return response.data;
};

// 채팅방을 나갑니다.
export const leaveChatRoom = async (chatRoomId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<ChatRoomLeaveResponse>>(
    `/chat-rooms/${chatRoomId}/leave`,
  );

  return response.data;
};
