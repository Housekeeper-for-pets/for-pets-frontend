import { axiosInstance } from './axiosInstance';
import type {
  ApiResponse,
  Coupon,
  CreateCouponRequest,
  Id,
  IssueCouponResponse,
  RevokeCouponResponse,
} from '../types';

// 로그인한 회원에게 쿠폰을 발급합니다.
export const issueCoupon = async (couponId: Id) => {
  const response = await axiosInstance.post<ApiResponse<IssueCouponResponse>>(
    `/coupons/${couponId}/issue`,
  );

  return response.data;
};

// 관리자 전용 쿠폰 생성 API입니다.
export const createCoupon = async (request: CreateCouponRequest) => {
  const response = await axiosInstance.post<ApiResponse<Coupon>>(
    '/admin/coupons',
    request,
  );

  return response.data;
};

// 관리자 전용 유저 쿠폰 회수 API입니다.
export const revokeUserCoupon = async (userCouponId: Id) => {
  const response = await axiosInstance.patch<ApiResponse<RevokeCouponResponse>>(
    `/admin/user-coupons/${userCouponId}/revoke`,
  );

  return response.data;
};
