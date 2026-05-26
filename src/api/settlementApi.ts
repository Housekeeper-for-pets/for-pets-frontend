import { axiosInstance } from './axiosInstance';
import type { ApiResponse, Id, Settlement } from '../types';

export const getMySettlements = async () => {
  const response = await axiosInstance.get<ApiResponse<Settlement[]>>(
    '/settlements/me',
  );

  return response.data;
};

export const getSettlement = async (settlementId: Id) => {
  const response = await axiosInstance.get<ApiResponse<Settlement>>(
    `/settlements/${settlementId}`,
  );

  return response.data;
};
