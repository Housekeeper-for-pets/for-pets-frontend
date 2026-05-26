import { axiosInstance } from './axiosInstance';
import type {
  AdminSitterProfile,
  ApiResponse,
  Id,
  RejectSitterRequest,
  Reservation,
} from '../types';

export const getPendingAdminSitters = async () => {
  const response = await axiosInstance.get<ApiResponse<AdminSitterProfile[]>>(
    '/admin/sitters',
  );

  return response.data;
};

export const approveAdminSitter = async (sitterProfileId: Id) => {
  const response = await axiosInstance.post<ApiResponse<AdminSitterProfile>>(
    `/admin/sitters/${sitterProfileId}/approve`,
  );

  return response.data;
};

export const rejectAdminSitter = async (
  sitterProfileId: Id,
  request: RejectSitterRequest,
) => {
  const response = await axiosInstance.post<ApiResponse<AdminSitterProfile>>(
    `/admin/sitters/${sitterProfileId}/reject`,
    request,
  );

  return response.data;
};

export const getAdminReservationCancelRequests = async () => {
  const response = await axiosInstance.get<ApiResponse<Reservation[]>>(
    '/admin/reservations/cancel-requests',
  );

  return response.data;
};

export const approveAdminReservationCancel = async (reservationId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Reservation>>(
    `/admin/reservations/${reservationId}/cancel-approve`,
  );

  return response.data;
};

export const rejectAdminReservationCancel = async (reservationId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Reservation>>(
    `/admin/reservations/${reservationId}/cancel-reject`,
  );

  return response.data;
};
