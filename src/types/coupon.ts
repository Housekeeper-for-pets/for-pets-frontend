import type { Id, ISODateTimeString } from './common';

export type UserCouponStatus = 'ACTIVE' | 'USED' | 'REVOKED';

export interface Coupon {
  couponId: Id;
  name: string;
  discountRate: number;
  totalQuantity: number;
  remainingQuantity: number;
}

export interface CreateCouponRequest {
  name: string;
  totalQuantity: number;
}

export interface IssueCouponResponse {
  userCouponId: Id;
  couponName: string;
  discountRate: number;
  status: UserCouponStatus;
  issuedAt: ISODateTimeString;
}

export interface RevokeCouponResponse {
  userCouponId: Id;
  status: UserCouponStatus;
}
