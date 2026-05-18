import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  CareRequest,
  CareRequestCreateRequest,
  Id,
} from '../types';

// 보호자가 특정 시터에게 돌봄 요청을 생성합니다.
export const createCareRequest = async (
  sitterId: Id,
  request: CareRequestCreateRequest,
) => {
  const response = await axiosInstance.post<ApiResponse<CareRequest>>(
    `/sitters/${sitterId}/requests`,
    request,
  );

  return response.data;
};

// 보호자가 본인이 보낸 돌봄 요청 목록을 조회합니다.
export const getSentCareRequests = async () => {
  const response = await axiosInstance.get<ApiResponse<CareRequest[]>>(
    '/requests/sent',
  );

  return response.data;
};

// 시터가 본인이 받은 돌봄 요청 목록을 조회합니다.
export const getReceivedCareRequests = async () => {
  const response = await axiosInstance.get<ApiResponse<CareRequest[]>>(
    '/requests/received',
  );

  return response.data;
};

// 돌봄 요청 당사자가 요청 상세를 조회합니다.
export const getCareRequest = async (requestId: Id) => {
  const response = await axiosInstance.get<ApiResponse<CareRequest>>(
    `/requests/${requestId}`,
  );

  return response.data;
};

// 보호자가 본인이 보낸 대기 중인 돌봄 요청을 취소합니다.
export const cancelSentCareRequest = async (requestId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<CareRequest>>(
    `/requests/sent/${requestId}/cancel`,
  );

  return response.data;
};

// 시터가 본인이 받은 대기 중인 돌봄 요청을 수락합니다.
export const acceptCareRequest = async (requestId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<CareRequest>>(
    `/requests/${requestId}/accept`,
  );

  return response.data;
};

// 시터가 본인이 받은 대기 중인 돌봄 요청을 거절합니다.
export const rejectCareRequest = async (requestId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<CareRequest>>(
    `/requests/${requestId}/reject`,
  );

  return response.data;
};
