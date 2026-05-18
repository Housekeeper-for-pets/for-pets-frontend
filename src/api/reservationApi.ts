import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  CancelReservationRequest,
  CancelReservationResponse,
  Id,
  PageResponse,
  Reservation,
  ReservationSearchQuery,
  ReservationStatusResponse,
} from '../types';

// 현재 로그인한 사용자의 예약 목록을 조회합니다.
export const getMyReservations = async (query?: ReservationSearchQuery) => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<Reservation>>>(
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

// PENDING 상태의 예약을 CONFIRMED 상태로 확정합니다.
export const confirmReservation = async (reservationId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<ReservationStatusResponse>>(
    `/reservations/${reservationId}/confirm`,
  );

  return response.data;
};

// 시터가 CONFIRMED 상태의 예약을 COMPLETED 상태로 완료 처리합니다.
export const completeReservation = async (reservationId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<ReservationStatusResponse>>(
    `/reservations/${reservationId}/complete`,
  );

  return response.data;
};

// 예약 당사자가 PENDING 또는 CONFIRMED 상태의 예약을 취소합니다.
export const cancelReservation = async (
  reservationId: Id,
  request: CancelReservationRequest,
) => {
  const response = await axiosInstance.patch<ApiResponse<CancelReservationResponse>>(
    `/reservations/${reservationId}/cancel`,
    request,
  );

  return response.data;
};
