import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  RagIndexResponse,
  RagSearchRequest,
  RagSearchResponse,
} from '../types';

export const searchAiReviewSources = async (request: RagSearchRequest) => {
  const response = await axiosInstance.post<ApiResponse<RagSearchResponse>>(
    '/ai/rag/search',
    request,
  );

  return response.data;
};

export const indexAiReviewSources = async () => {
  const response = await axiosInstance.post<ApiResponse<RagIndexResponse>>(
    '/ai/rag/reviews/index',
    undefined,
    {
      timeout: 60000,
    },
  );

  return response.data;
};
