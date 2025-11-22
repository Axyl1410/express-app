import { deleteCache, getCache, setCache } from "@/lib/cache.helper";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@/types/enums";
import type {
  CreateProductInput,
  ProductDetailType,
  ProductListResponseType,
  UpdateProductInput,
} from "@/types/product";

/**
 * Build cache key for product list
 */
function buildListCacheKey(params: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  brandId?: string;
  search?: string;
}): string {
  const { page = 1, limit = 10, status, categoryId, brandId, search } = params;
  const parts = [
    "product:list",
    `page:${page}`,
    `limit:${limit}`,
    status ? `status:${status}` : "",
    categoryId ? `category:${categoryId}` : "",
    brandId ? `brand:${brandId}` : "",
    search ? `search:${search}` : "",
  ].filter(Boolean);
  return parts.join(":");
}

/**
 * Invalidate all product-related cache
 * Note: In production, you might want to use Redis SCAN to find all product:* keys
 * For now, we'll invalidate specific patterns
 */
function invalidateProductCache(): void {
  logger.debug(
    "Product cache should be invalidated (specific keys handled per operation)"
  );
}

/**
 * Get products with pagination, filtering, and sorting
 */
export async function getProducts(params: {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  categoryId?: string;
  brandId?: string;
  search?: string;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}): Promise<ProductListResponseType> {
  const {
    page = 1,
    limit = 10,
    status,
    categoryId,
    brandId,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Build cache key
  const cacheKey = buildListCacheKey({
    page,
    limit,
    status,
    categoryId,
    brandId,
    search,
  });

  // Try to get from cache
  const cached = await getCache<ProductListResponseType>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, "Product list cache hit");
    return cached;
  }

  // Build where clause
  const where: {
    status?: ProductStatus;
    categoryId?: string;
    brandId?: string;
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (status) {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (brandId) {
    where.brandId = brandId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get total count
  const total = await prisma.product.count({ where });

  // Get products
  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const totalPages = Math.ceil(total / limit);

  const result: ProductListResponseType = {
    products,
    total,
    page,
    limit,
    totalPages,
  };

  // Cache the result
  await setCache(cacheKey, result, 300);

  return result;
}

/**
 * Get product by ID with variants and images
 */
export async function getProductById(
  id: string
): Promise<ProductDetailType | null> {
  const cacheKey = `product:id:${id}`;

  // Try to get from cache
  const cached = await getCache<ProductDetailType>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, "Product detail cache hit");
    return cached;
  }

  // Get product with relations
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
      images: {
        where: {
          variantId: null, // Only product-level images
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  // Transform to ProductDetailType
  const result: ProductDetailType = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brandId: product.brandId,
    categoryId: product.categoryId,
    defaultImage: product.defaultImage,
    seoMetaTitle: product.seoMetaTitle,
    seoMetaDesc: product.seoMetaDesc,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    brand: product.brand,
    category: product.category,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      attributes: variant.attributes as Record<string, unknown> | null,
      price: Number(variant.price),
      salePrice: variant.salePrice ? Number(variant.salePrice) : null,
      stockQuantity: variant.stockQuantity,
      weight: variant.weight,
      barcode: variant.barcode,
      images: variant.images,
    })),
    images: product.images,
  };

  // Cache the result
  await setCache(cacheKey, result, 300);

  return result;
}

/**
 * Get product by slug with variants and images
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductDetailType | null> {
  const cacheKey = `product:slug:${slug}`;

  // Try to get from cache
  const cached = await getCache<ProductDetailType>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, "Product detail by slug cache hit");
    return cached;
  }

  // Get product with relations
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
      images: {
        where: {
          variantId: null, // Only product-level images
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  // Transform to ProductDetailType
  const result: ProductDetailType = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brandId: product.brandId,
    categoryId: product.categoryId,
    defaultImage: product.defaultImage,
    seoMetaTitle: product.seoMetaTitle,
    seoMetaDesc: product.seoMetaDesc,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    brand: product.brand,
    category: product.category,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      attributes: variant.attributes as Record<string, unknown> | null,
      price: Number(variant.price),
      salePrice: variant.salePrice ? Number(variant.salePrice) : null,
      stockQuantity: variant.stockQuantity,
      weight: variant.weight,
      barcode: variant.barcode,
      images: variant.images,
    })),
    images: product.images,
  };

  // Cache the result
  await setCache(cacheKey, result, 300);

  return result;
}

/**
 * Create a new product
 */
export async function createProduct(
  data: CreateProductInput
): Promise<ProductDetailType> {
  const { variants, images, ...productData } = data;

  // Create product
  const product = await prisma.product.create({
    data: {
      ...productData,
      status: productData.status ?? ProductStatus.DRAFT,
    },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: true,
      images: {
        where: {
          variantId: null,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  // Create variants if provided
  if (variants && variants.length > 0) {
    await Promise.all(
      variants.map((variantData) =>
        prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variantData.sku ?? null,
            // biome-ignore lint/suspicious/noExplicitAny: Prisma JSON type requires any
            attributes: variantData.attributes as any,
            price: variantData.price,
            salePrice: variantData.salePrice ?? null,
            stockQuantity: variantData.stockQuantity,
            weight: variantData.weight ?? null,
            barcode: variantData.barcode ?? null,
          },
        })
      )
    );
  }

  // Create images if provided
  if (images && images.length > 0) {
    await Promise.all(
      images.map((imageData) =>
        prisma.productImage.create({
          data: {
            ...imageData,
            productId: product.id,
          },
        })
      )
    );
  }

  // Invalidate cache
  await invalidateProductCache();

  // Get the full product with all relations
  const result = await getProductById(product.id);

  if (!result) {
    throw new Error("Failed to retrieve created product");
  }

  logger.info({ productId: product.id }, "Product created successfully");

  return result;
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ProductDetailType> {
  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  // Update product
  await prisma.product.update({
    where: { id },
    data,
  });

  // Invalidate cache
  await invalidateProductCache();
  await deleteCache(`product:id:${id}`);
  await deleteCache(`product:slug:${existingProduct.slug}`);
  if (data.slug && data.slug !== existingProduct.slug) {
    await deleteCache(`product:slug:${data.slug}`);
  }

  // Get updated product
  const result = await getProductById(id);

  if (!result) {
    throw new Error("Failed to retrieve updated product");
  }

  logger.info({ productId: id }, "Product updated successfully");

  return result;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Delete product (cascade will delete variants and images)
  await prisma.product.delete({
    where: { id },
  });

  // Invalidate cache
  await invalidateProductCache();
  await deleteCache(`product:id:${id}`);
  await deleteCache(`product:slug:${product.slug}`);

  logger.info({ productId: id }, "Product deleted successfully");
}
