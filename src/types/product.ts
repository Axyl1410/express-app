import type { ProductStatus } from "./enums";

export type ProductType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  defaultImage?: string | null;
  seoMetaTitle?: string | null;
  seoMetaDesc?: string | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductVariantType = {
  id: string;
  productId: string;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  weight?: number | null;
  barcode?: string | null;
};

export type ProductImageType = {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder?: number | null;
};
