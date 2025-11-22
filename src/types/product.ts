import type { BrandType, CategoryType } from "./category";
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

// Product variant with images
export type ProductVariantWithImagesType = ProductVariantType & {
  images: ProductImageType[];
};

// Product detail with variants and images
export type ProductDetailType = ProductType & {
  brand?: Pick<BrandType, "id" | "name" | "slug"> | null;
  category?: Pick<CategoryType, "id" | "name" | "slug"> | null;
  variants: ProductVariantWithImagesType[];
  images: ProductImageType[];
};

// Pagination response
export type ProductListResponseType = {
  products: ProductType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Create product input
export type CreateProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  defaultImage?: string | null;
  seoMetaTitle?: string | null;
  seoMetaDesc?: string | null;
  status?: ProductStatus;
  variants?: Array<{
    sku?: string | null;
    attributes?: Record<string, unknown> | null;
    price: number;
    salePrice?: number | null;
    stockQuantity: number;
    weight?: number | null;
    barcode?: string | null;
  }>;
  images?: Array<{
    url: string;
    altText?: string | null;
    sortOrder?: number | null;
    variantId?: string | null;
  }>;
};

// Update product input
export type UpdateProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  defaultImage?: string | null;
  seoMetaTitle?: string | null;
  seoMetaDesc?: string | null;
  status?: ProductStatus;
};
