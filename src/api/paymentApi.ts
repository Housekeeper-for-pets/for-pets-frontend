import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  CreatePaymentRequest,
  PaymentResponse,
} from '../types';

// 예약 결제 요청을 생성하고 PortOne paymentId로 사용할 merchantUid를 발급받습니다.
export const createPayment = async (request: CreatePaymentRequest) => {
  const response = await axiosInstance.post<ApiResponse<PaymentResponse>>(
    '/payments',
    request,
  );

  return response.data;
};
