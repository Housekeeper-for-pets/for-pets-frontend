import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  Id,
  Notification,
  UnreadNotificationCountResponse,
} from '../types';

interface NotificationQuery {
  userId: Id;
  unreadOnly?: boolean;
}

// 로그인 사용자의 알림 목록을 조회합니다. 현재 백엔드는 userId 쿼리 파라미터를 요구합니다.
export const getNotifications = async (query: NotificationQuery) => {
  const response = await axiosInstance.get<ApiResponse<Notification[]>>(
    '/notifications',
    { params: query },
  );

  return response.data;
};

// 알림을 읽음 처리합니다.
export const markNotificationAsRead = async (notificationId: Id, userId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<string>>(
    `/notifications/${notificationId}/read`,
    null,
    { params: { userId } },
  );

  return response.data;
};

// 미읽음 알림 개수를 조회합니다.
export const getUnreadNotificationCount = async (userId: Id) => {
  const response = await axiosInstance.get<
    ApiResponse<UnreadNotificationCountResponse>
  >('/notifications/unread-count', {
    params: { userId },
  });

  return response.data;
};
