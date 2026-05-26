import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  CreatePaymentRequest,
  FailPaymentRequest,
  Id,
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

// 프론트 결제창 실패/취소 결과를 서버 결제 상태에 반영합니다.
export const failPayment = async (request: FailPaymentRequest) => {
  const response = await axiosInstance.post<ApiResponse<PaymentResponse>>(
    '/payments/fail',
    request,
  );

  return response.data;
};

// 로그인한 사용자의 결제 목록을 조회합니다.
export const getMyPayments = async () => {
  const response = await axiosInstance.get<ApiResponse<PaymentResponse[]>>(
    '/payments/me',
  );

  return response.data;
};

// 결제 상세를 조회합니다.
export const getPayment = async (paymentId: Id) => {
  const response = await axiosInstance.get<ApiResponse<PaymentResponse>>(
    `/payments/${paymentId}`,
  );

  return response.data;
};
