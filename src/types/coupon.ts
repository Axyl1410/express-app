import type { CouponType as CouponTypeEnum } from "./enums";

export type CouponType = {
  id: string;
  code: string;
  type: CouponTypeEnum;
  value: number;
  description?: string | null;
  minOrderAmount?: number | null;
  startsAt: Date;
  endsAt: Date;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerUser?: number | null;
  active: boolean;
  createdAt: Date;
};
