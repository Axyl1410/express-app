export type CartType = {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CartItemType = {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  priceAtAdd: number;
  createdAt: Date;
};
