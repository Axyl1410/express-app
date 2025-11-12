import { fromNodeHeaders } from "better-auth/node";
import express, { type Request, type Response, type Router } from "express";
import {
  asyncHandler,
  sendError,
  sendSuccess,
  sendSuccessNoData,
} from "@/lib/api-response-helper";
import { auth } from "@/lib/auth";
import {
  addItemToCart,
  clearCart,
  getCartById,
  getOrCreateCart,
  removeCartItem,
  updateCartItem,
} from "./service";

const cartRouter: Router = express.Router();

/**
 * Helper to get session and user from request (optional, doesn't throw error)
 * Uses the same method as auth.middleware.ts but doesn't require authentication
 */
async function getOptionalSession(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return session;
  } catch {
    // Return null if no session (guest user)
    return null;
  }
}

/**
 * Helper to get sessionId from request (header)
 * Note: For guest users, client should send x-session-id header
 */
function getSessionId(req: Request): string | undefined {
  // Get from header
  const sessionHeader = req.headers["x-session-id"] as string | undefined;
  return sessionHeader;
}

/**
 * GET /api/v1/cart
 * Get current user's or guest's cart
 */
cartRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Get session using the same method as auth.middleware.ts
    const session = await getOptionalSession(req);
    const userId = session?.user?.id;
    const sessionId = getSessionId(req);

    // If no userId and no sessionId, return error
    const hasIdentifier = userId || sessionId;
    if (!hasIdentifier) {
      sendError(
        res,
        "Session ID required for guest users. Please provide x-session-id header or sessionId cookie.",
        400
      );
      return;
    }

    const cart = await getOrCreateCart(userId, sessionId);
    const cartWithItems = await getCartById(cart.id);

    if (!cartWithItems) {
      sendError(res, "Cart not found", 404);
      return;
    }

    sendSuccess(res, cartWithItems, "Cart retrieved successfully");
  })
);

/**
 * POST /api/v1/cart
 * Add item to cart
 */
cartRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Get session using the same method as auth.middleware.ts
    const session = await getOptionalSession(req);
    const userId = session?.user?.id;
    const sessionId = getSessionId(req);

    const hasIdentifier = userId || sessionId;
    if (!hasIdentifier) {
      sendError(
        res,
        "Session ID required for guest users. Please provide x-session-id header or sessionId cookie.",
        400
      );
      return;
    }

    const { variantId, quantity } = req.body as {
      variantId?: string;
      quantity?: number;
    };

    if (!variantId || typeof variantId !== "string") {
      sendError(res, "variantId is required and must be a string", 400);
      return;
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      sendError(res, "quantity is required and must be a positive number", 400);
      return;
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId, sessionId);

    // Add item to cart
    const cartItem = await addItemToCart(cart.id, variantId, quantity);

    sendSuccess(res, cartItem, "Item added to cart successfully");
  })
);

/**
 * PUT /api/v1/cart/items/:itemId
 * Update cart item quantity
 */
cartRouter.put(
  "/items/:itemId",
  asyncHandler(async (req: Request, res: Response) => {
    // Get session using the same method as auth.middleware.ts
    const session = await getOptionalSession(req);
    const userId = session?.user?.id;
    const sessionId = getSessionId(req);

    const hasIdentifier = userId || sessionId;
    if (!hasIdentifier) {
      sendError(
        res,
        "Session ID required for guest users. Please provide x-session-id header or sessionId cookie.",
        400
      );
      return;
    }

    const { itemId } = req.params;
    const { quantity } = req.body as { quantity?: number };

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      sendError(res, "quantity is required and must be a positive number", 400);
      return;
    }

    const cartItem = await updateCartItem(itemId, quantity);

    sendSuccess(res, cartItem, "Cart item updated successfully");
  })
);

/**
 * DELETE /api/v1/cart/items/:itemId
 * Remove item from cart
 */
cartRouter.delete(
  "/items/:itemId",
  asyncHandler(async (req: Request, res: Response) => {
    // Get session using the same method as auth.middleware.ts
    const session = await getOptionalSession(req);
    const userId = session?.user?.id;
    const sessionId = getSessionId(req);

    const hasIdentifier = userId || sessionId;
    if (!hasIdentifier) {
      sendError(
        res,
        "Session ID required for guest users. Please provide x-session-id header or sessionId cookie.",
        400
      );
      return;
    }

    const { itemId } = req.params;

    await removeCartItem(itemId);

    sendSuccessNoData(res, "Item removed from cart successfully");
  })
);

/**
 * DELETE /api/v1/cart
 * Clear all items from cart
 */
cartRouter.delete(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Get session using the same method as auth.middleware.ts
    const session = await getOptionalSession(req);
    const userId = session?.user?.id;
    const sessionId = getSessionId(req);

    const hasIdentifier = userId || sessionId;
    if (!hasIdentifier) {
      sendError(
        res,
        "Session ID required for guest users. Please provide x-session-id header or sessionId cookie.",
        400
      );
      return;
    }

    const cart = await getOrCreateCart(userId, sessionId);
    await clearCart(cart.id);

    sendSuccessNoData(res, "Cart cleared successfully");
  })
);

export default cartRouter;
