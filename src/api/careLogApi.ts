import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  CareLog,
  CreateCareLogRequest,
  Id,
} from '../types';

export const createCareLog = async (
  reservationId: Id,
  request: CreateCareLogRequest,
) => {
  const response = await axiosInstance.post<ApiResponse<CareLog>>(
    `/reservations/${reservationId}/care-logs`,
    request,
  );

  return response.data;
};

export const getReservationCareLogs = async (reservationId: Id) => {
  const response = await axiosInstance.get<ApiResponse<CareLog[]>>(
    `/reservations/${reservationId}/care-logs`,
  );

  return response.data;
};
