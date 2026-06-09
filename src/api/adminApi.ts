import { axiosInstance } from './axiosInstance';
import type {
  AdminSitterDetail,
  AdminSitterProfile,
  ApiResponse,
  Id,
  PageResponse,
  RejectSitterRequest,
  Reservation,
} from '../types';

export const getPendingAdminSitters = async (page = 0, size = 50) => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<AdminSitterProfile>>>(
    '/admin/sitters',
    { params: { page, size } },
  );

  return response.data;
};

export const getAdminSitterDetail = async (sitterProfileId: Id) => {
  const response = await axiosInstance.get<ApiResponse<AdminSitterDetail>>(
    `/admin/sitters/${sitterProfileId}`,
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

export const getAdminReservationCancelRequests = async (page = 0, size = 50) => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<Reservation>>>(
    '/admin/reservations/cancel-requests',
    { params: { page, size } },
  );

  return response.data;
};

export const approveAdminReservationCancel = async (reservationId: Id) => {
  const response = await axiosInstance.post<ApiResponse<Reservation>>(
    `/admin/reservations/${reservationId}/approve`,
  );

  return response.data;
};

export const rejectAdminReservationCancel = async (reservationId: Id) => {
  const response = await axiosInstance.post<ApiResponse<Reservation>>(
    `/admin/reservations/${reservationId}/reject`,
  );

  return response.data;
};
