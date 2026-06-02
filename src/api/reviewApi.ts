import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  CreateReviewRequest,
  Id,
  MyReceivedReviewPageResponse,
  MyWrittenReviewPageResponse,
  Review,
  ReviewPageResponse,
  ReviewSearchQuery,
} from '../types';

export const createReview = async (request: CreateReviewRequest) => {
  const response = await axiosInstance.post<ApiResponse<Review>>(
    '/reviews',
    request,
  );

  return response.data;
};

export const deleteReview = async (reviewId: Id) => {
  const response = await axiosInstance.delete<ApiResponse<null>>(
    `/reviews/${reviewId}`,
  );

  return response.data;
};

export const getSitterReviews = async (
  sitterId: Id,
  query?: ReviewSearchQuery,
) => {
  const response = await axiosInstance.get<ApiResponse<ReviewPageResponse>>(
    `/reviews/sitters/${sitterId}`,
    { params: query },
  );

  return response.data;
};

export const getMyWrittenReviews = async (query?: ReviewSearchQuery) => {
  const response = await axiosInstance.get<
    ApiResponse<MyWrittenReviewPageResponse>
  >('/reviews/me', { params: query });

  return response.data;
};

export const getMyReceivedReviews = async (query?: ReviewSearchQuery) => {
  const response = await axiosInstance.get<
    ApiResponse<MyReceivedReviewPageResponse>
  >('/reviews/me/received', { params: query });

  return response.data;
};
