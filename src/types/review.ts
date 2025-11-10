import type { ReviewStatus } from "./enums";

export type ReviewType = {
  id: string;
  productId: string;
  userId: string;
  orderItemId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  status: ReviewStatus;
  createdAt: Date;
};
