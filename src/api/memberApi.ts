import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  ChangePasswordRequest,
  Member,
  MessageResponse,
  UpdateMemberRequest,
} from '../types';

// 현재 로그인한 회원의 정보를 조회합니다.
export const getMyInfo = async () => {
  const response = await axiosInstance.get<ApiResponse<Member>>('/members/me');

  return response.data;
};

// 현재 로그인한 회원의 닉네임, 전화번호, 성별, 지역을 수정합니다.
export const updateMyInfo = async (request: UpdateMemberRequest) => {
  const response = await axiosInstance.put<ApiResponse<Member>>(
    '/members/me',
    request,
  );

  return response.data;
};

// 현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
export const changeMyPassword = async (request: ChangePasswordRequest) => {
  const response = await axiosInstance.patch<ApiResponse<MessageResponse>>(
    '/members/me/password',
    request,
  );

  return response.data;
};

// 회원 탈퇴 API를 호출합니다.
export const deleteMyAccount = async () => {
  const response = await axiosInstance.delete<ApiResponse<MessageResponse>>(
    '/members/me',
  );

  return response.data;
};
