import { axiosInstance } from './axiosInstance';
import type { ApiResponse, Id, SitterReviewSummary } from '../types';

export const getSitterReviewSummary = async (sitterId: Id) => {
  const response = await axiosInstance.get<ApiResponse<SitterReviewSummary>>(
    `/sitters/${sitterId}/review-summary`,
  );

  return response.data;
};

export const generateSitterReviewSummary = async (sitterId: Id) => {
  const response = await axiosInstance.post<ApiResponse<SitterReviewSummary>>(
    `/ai/sitters/${sitterId}/review-summary`,
  );

  return response.data;
};
