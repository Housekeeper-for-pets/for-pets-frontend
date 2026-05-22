import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
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

// PortOne 결제 완료 후 서버에서 승인 내역을 검증합니다.
export const confirmPayment = async (request: ConfirmPaymentRequest) => {
  const response = await axiosInstance.post<ApiResponse<ConfirmPaymentResponse>>(
    '/payments/confirm',
    request,
  );

  return response.data;
};
