import type { OrderStatus, PaymentStatus } from "./enums";

export type OrderType = {
  id: string;
  orderNo: string;
  userId: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  payStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod?: string | null;
  shippingAddress: Record<string, unknown>;
  notes?: string | null;
  adminNotes?: string | null;
  trackingNumber?: string | null;
  couponId?: string | null;
  appliedCouponCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItemType = {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantAttributes?: Record<string, unknown> | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type PaymentType = {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: number;
  providerTxnId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};

export type OrderStatusHistoryType = {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string | null;
  changedBy?: string | null;
  createdAt: Date;
};
