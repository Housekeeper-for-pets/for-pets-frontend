import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  Id,
  PageResponse,
  ReplaceSitterSchedulesRequest,
  SitterProfile,
  SitterProfileRequest,
  SitterSchedule,
  SitterSearchQuery,
  UpdateSitterStatusRequest,
  UpdateSitterProfileRequest,
} from '../types';

// 시터 프로필을 등록하고 회원 역할을 SITTER로 전환합니다.
export const createSitterProfile = async (request: SitterProfileRequest) => {
  const response = await axiosInstance.post<ApiResponse<SitterProfile>>(
    '/sitters',
    request,
  );

  return response.data;
};

// 조건에 맞는 시터 목록을 검색합니다.
export const searchSitters = async (query?: SitterSearchQuery) => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<SitterProfile>>>(
    '/sitters',
    { params: query },
  );

  return response.data;
};

// 특정 시터의 상세 프로필을 조회합니다.
export const getSitterProfile = async (sitterId: Id) => {
  const response = await axiosInstance.get<ApiResponse<SitterProfile>>(
    `/sitters/${sitterId}`,
  );

  return response.data;
};

// 현재 로그인한 사용자의 시터 프로필을 조회합니다.
export const getMySitterProfile = async () => {
  const response = await axiosInstance.get<ApiResponse<SitterProfile>>(
    '/sitters/me',
  );

  return response.data;
};

// 현재 로그인한 사용자의 시터 프로필을 수정합니다.
export const updateMySitterProfile = async (request: UpdateSitterProfileRequest) => {
  const response = await axiosInstance.put<ApiResponse<SitterProfile>>(
    '/sitters/me',
    request,
  );

  return response.data;
};

// 시터의 예약 가능 상태를 변경합니다.
export const updateMySitterStatus = async (request: UpdateSitterStatusRequest) => {
  const response = await axiosInstance.patch<ApiResponse<SitterProfile>>(
    '/sitters/me/status',
    request,
  );

  return response.data;
};

// 내 시터 프로필을 삭제합니다.
export const deleteMySitterProfile = async () => {
  const response = await axiosInstance.delete<ApiResponse<null>>('/sitters/me');

  return response.data;
};

// 내 시터 가능 시간을 전체 교체합니다.
export const replaceMySitterSchedules = async (
  request: ReplaceSitterSchedulesRequest,
) => {
  const response = await axiosInstance.put<ApiResponse<SitterSchedule[]>>(
    '/sitters/me/schedules',
    request,
  );

  return response.data;
};

// 내 시터 가능 시간 목록을 조회합니다.
export const getMySitterSchedules = async () => {
  const response = await axiosInstance.get<ApiResponse<SitterSchedule[]>>(
    '/sitters/me/schedules',
  );

  return response.data;
};
