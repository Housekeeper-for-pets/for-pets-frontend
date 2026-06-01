import { axiosInstance } from './axiosInstance';
import type { AiChatRequest, AiChatResponse, ApiResponse } from '../types';

export const sendAiChatMessage = async (request: AiChatRequest) => {
  const response = await axiosInstance.post<ApiResponse<AiChatResponse>>(
    '/ai/chat',
    request,
  );

  return response.data;
};
