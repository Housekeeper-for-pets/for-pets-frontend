import { axiosInstance } from './axiosInstance';
import type { ApiResponse, Id, Proposal, ProposalRequest } from '../types';

// 시터가 특정 공고에 제안을 등록합니다.
export const createProposal = async (postId: Id, request: ProposalRequest) => {
  const response = await axiosInstance.post<ApiResponse<Proposal>>(
    `/posts/${postId}/proposals`,
    request,
  );

  return response.data;
};

// 공고 작성자가 해당 공고에 들어온 제안 목록을 조회합니다.
export const getPostProposals = async (postId: Id) => {
  const response = await axiosInstance.get<ApiResponse<Proposal[]>>(
    `/posts/${postId}/proposals`,
  );

  return response.data;
};

// 시터가 본인이 등록한 제안 목록을 조회합니다.
export const getMyProposals = async () => {
  const response = await axiosInstance.get<ApiResponse<Proposal[]>>(
    '/proposals/me',
  );

  return response.data;
};

// 공고 작성자 또는 제안 생성자가 제안 상세를 조회합니다.
export const getProposal = async (proposalId: Id) => {
  const response = await axiosInstance.get<ApiResponse<Proposal>>(
    `/proposals/${proposalId}`,
  );

  return response.data;
};

// 공고 작성자가 대기 중인 제안을 수락합니다.
export const acceptProposal = async (proposalId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/accept`,
  );

  return response.data;
};

// 공고 작성자가 대기 중인 제안을 거절합니다.
export const rejectProposal = async (proposalId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/reject`,
  );

  return response.data;
};

// 시터가 본인이 등록한 대기 중인 제안을 철회합니다.
export const withdrawProposal = async (proposalId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<Proposal>>(
    `/proposals/${proposalId}/withdraw`,
  );

  return response.data;
};
