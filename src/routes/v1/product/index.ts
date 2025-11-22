import express, { type Request, type Response, type Router } from "express";
import {
  asyncHandler,
  sendError,
  sendSuccess,
  sendSuccessNoData,
} from "@/lib/api-response-helper";
import AdminMiddleware from "@/middleware/admin.middleware";
import type { CreateProductInput, UpdateProductInput } from "@/types/product";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  getProducts,
  updateProduct,
} from "./service";

const productRouter: Router = express.Router();

/**
 * GET /api/v1/products
 * Get list of products with pagination, filtering, and sorting
 * Public access (no authentication required)
 */
productRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page
      ? Number.parseInt(req.query.page as string, 10)
      : 1;
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : 10;
    const status = req.query.status as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const brandId = req.query.brandId as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy =
      (req.query.sortBy as "name" | "createdAt" | "updatedAt") ?? "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") ?? "desc";

    // Validate pagination
    if (page < 1) {
      sendError(res, "Page must be greater than 0", 400);
      return;
    }

    if (limit < 1 || limit > 100) {
      sendError(res, "Limit must be between 1 and 100", 400);
      return;
    }

    const result = await getProducts({
      page,
      limit,
      status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
      categoryId,
      brandId,
      search,
      sortBy,
      sortOrder,
    });

    sendSuccess(res, result, "Products retrieved successfully");
  })
);

/**
 * GET /api/v1/products/:id
 * Get product detail by ID with variants and images
 * Public access (no authentication required)
 */
productRouter.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      sendError(res, "Product ID is required", 400);
      return;
    }

    const product = await getProductById(id);

    if (!product) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, product, "Product retrieved successfully");
  })
);

/**
 * GET /api/v1/products/slug/:slug
 * Get product detail by slug with variants and images
 * Public access (no authentication required)
 */
productRouter.get(
  "/slug/:slug",
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
      sendError(res, "Product slug is required", 400);
      return;
    }

    const product = await getProductBySlug(slug);

    if (!product) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, product, "Product retrieved successfully");
  })
);

/**
 * POST /api/v1/products
 * Create a new product
 * Admin authentication required
 */
productRouter.post(
  "/",
  AdminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateProductInput;

    // Validate required fields
    if (!data.name || typeof data.name !== "string") {
      sendError(res, "Product name is required and must be a string", 400);
      return;
    }

    if (!data.slug || typeof data.slug !== "string") {
      sendError(res, "Product slug is required and must be a string", 400);
      return;
    }

    // Validate slug format (alphanumeric, hyphens, underscores)
    if (!/^[a-z0-9-_]+$/.test(data.slug)) {
      sendError(
        res,
        "Product slug must contain only lowercase letters, numbers, hyphens, and underscores",
        400
      );
      return;
    }

    // Validate variants if provided
    if (data.variants) {
      for (const variant of data.variants) {
        if (typeof variant.price !== "number" || variant.price < 0) {
          sendError(res, "Variant price must be a non-negative number", 400);
          return;
        }

        if (
          typeof variant.stockQuantity !== "number" ||
          variant.stockQuantity < 0
        ) {
          sendError(
            res,
            "Variant stockQuantity must be a non-negative number",
            400
          );
          return;
        }

        if (
          variant.salePrice !== undefined &&
          variant.salePrice !== null &&
          (typeof variant.salePrice !== "number" || variant.salePrice < 0)
        ) {
          sendError(
            res,
            "Variant salePrice must be a non-negative number",
            400
          );
          return;
        }
      }
    }

    // Validate images if provided
    if (data.images) {
      for (const image of data.images) {
        if (!image.url || typeof image.url !== "string") {
          sendError(res, "Image URL is required and must be a string", 400);
          return;
        }
      }
    }

    try {
      const product = await createProduct(data);
      sendSuccess(res, product, "Product created successfully", 201);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create product";

      // Handle unique constraint violation (slug)
      if (
        errorMessage.includes("Unique constraint") ||
        errorMessage.includes("slug")
      ) {
        sendError(res, "Product with this slug already exists", 409);
        return;
      }

      // Handle foreign key constraint violation
      if (
        errorMessage.includes("Foreign key constraint") ||
        errorMessage.includes("categoryId") ||
        errorMessage.includes("brandId")
      ) {
        sendError(res, "Invalid category or brand ID", 400);
        return;
      }

      sendError(res, errorMessage, 500);
    }
  })
);

/**
 * PUT /api/v1/products/:id
 * Update a product
 * Admin authentication required
 */
productRouter.put(
  "/:id",
  AdminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateProductInput;

    if (!id) {
      sendError(res, "Product ID is required", 400);
      return;
    }

    // Validate slug format if provided
    if (data.slug && !/^[a-z0-9-_]+$/.test(data.slug)) {
      sendError(
        res,
        "Product slug must contain only lowercase letters, numbers, hyphens, and underscores",
        400
      );
      return;
    }

    try {
      const product = await updateProduct(id, data);
      sendSuccess(res, product, "Product updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update product";

      if (errorMessage.includes("not found")) {
        sendError(res, "Product not found", 404);
        return;
      }

      // Handle unique constraint violation (slug)
      if (
        errorMessage.includes("Unique constraint") ||
        errorMessage.includes("slug")
      ) {
        sendError(res, "Product with this slug already exists", 409);
        return;
      }

      // Handle foreign key constraint violation
      if (
        errorMessage.includes("Foreign key constraint") ||
        errorMessage.includes("categoryId") ||
        errorMessage.includes("brandId")
      ) {
        sendError(res, "Invalid category or brand ID", 400);
        return;
      }

      sendError(res, errorMessage, 500);
    }
  })
);

/**
 * DELETE /api/v1/products/:id
 * Delete a product
 * Admin authentication required
 */
productRouter.delete(
  "/:id",
  AdminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      sendError(res, "Product ID is required", 400);
      return;
    }

    try {
      await deleteProduct(id);
      sendSuccessNoData(res, "Product deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete product";

      if (errorMessage.includes("not found")) {
        sendError(res, "Product not found", 404);
        return;
      }

      sendError(res, errorMessage, 500);
    }
  })
);

export default productRouter;
