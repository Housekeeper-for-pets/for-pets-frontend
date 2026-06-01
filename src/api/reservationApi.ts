import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  CancelReservationRequest,
  Id,
  Reservation,
  ReservationRole,
} from '../types';

interface MyReservationQuery {
  roleAs?: ReservationRole;
}

// 현재 로그인한 사용자의 예약 목록을 조회합니다.
export const getMyReservations = async (query?: MyReservationQuery) => {
  const response = await axiosInstance.get<ApiResponse<Reservation[]>>(
    '/reservations/me',
    { params: query },
  );

  return response.data;
};

// 예약 당사자가 예약 상세 정보를 조회합니다.
export const getReservation = async (reservationId: Id) => {
  const response = await axiosInstance.get<ApiResponse<Reservation>>(
    `/reservations/${reservationId}`,
  );

  return response.data;
};

// 시터가 CONFIRMED 상태의 예약을 COMPLETED 상태로 완료 처리합니다.
export const completeReservation = async (reservationId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Reservation>>(
    `/reservations/${reservationId}/complete`,
  );

  return response.data;
};

// 예약 당사자가 PENDING 또는 CONFIRMED 상태의 예약을 취소합니다.
export const cancelReservation = async (
  reservationId: Id,
  request: CancelReservationRequest,
) => {
  const response = await axiosInstance.patch<ApiResponse<Reservation>>(
    `/reservations/${reservationId}/cancel`,
    request,
  );

  return response.data;
};
