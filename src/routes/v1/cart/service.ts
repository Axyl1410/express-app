import { deleteCache, getCache, setCache } from "@/lib/cache.helper";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { CartItemType, CartType } from "@/types/cart";

/**
 * Merge guest cart items into user cart
 * Rule: When a guest logs in, merge their sessionId cart into their userId cart
 */
async function mergeGuestCartToUserCart(
  userId: string,
  sessionId: string
): Promise<CartType> {
  // Get both carts
  const guestCart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });

  const userCart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  // If no guest cart, just return user cart (or create if doesn't exist)
  if (!guestCart || guestCart.items.length === 0) {
    if (userCart) {
      return userCart;
    }
    // Create user cart if doesn't exist
    const newCart = await prisma.cart.create({
      data: { userId },
    });
    await deleteCache(`cart:userId:${userId}`);
    return newCart;
  }

  // If no user cart, convert guest cart to user cart
  if (!userCart) {
    const updatedCart = await prisma.cart.update({
      where: { id: guestCart.id },
      data: {
        userId,
        sessionId: null, // Remove sessionId since it's now a user cart
      },
    });

    // Invalidate caches
    await deleteCache(`cart:sessionId:${sessionId}`);
    await deleteCache(`cart:userId:${userId}`);
    await deleteCache(`cart:${guestCart.id}`);

    logger.info(
      {
        cartId: updatedCart.id,
        userId,
        sessionId,
        itemsCount: guestCart.items.length,
      },
      "Converted guest cart to user cart"
    );

    return updatedCart;
  }

  // Both carts exist - merge items
  // For each item in guest cart, add to user cart (or update quantity if exists)
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      (item) => item.variantId === guestItem.variantId
    );

    if (existingItem) {
      // Update quantity (add guest quantity to user quantity)
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + guestItem.quantity,
          // Keep the lower price (better for customer)
          priceAtAdd:
            guestItem.priceAtAdd < existingItem.priceAtAdd
              ? guestItem.priceAtAdd
              : existingItem.priceAtAdd,
        },
      });
    } else {
      // Move item from guest cart to user cart
      await prisma.cartItem.update({
        where: { id: guestItem.id },
        data: { cartId: userCart.id },
      });
    }
  }

  // Delete guest cart (items are already moved/merged)
  await prisma.cart.delete({
    where: { id: guestCart.id },
  });

  // Invalidate caches
  await deleteCache(`cart:sessionId:${sessionId}`);
  await deleteCache(`cart:userId:${userId}`);
  await deleteCache(`cart:${guestCart.id}`);
  await deleteCache(`cart:${userCart.id}`);

  // Get updated user cart
  const mergedCart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!mergedCart) {
    throw new Error("Failed to merge carts");
  }

  logger.info(
    {
      userId,
      sessionId,
      guestCartId: guestCart.id,
      userCartId: userCart.id,
      mergedItemsCount: guestCart.items.length,
    },
    "Merged guest cart into user cart"
  );

  return mergedCart;
}

/**
 * Get or create cart for user or guest
 * Rule 1-1: One user = one cart (by userId or sessionId)
 * Rule Merge: If both userId and sessionId provided, merge guest cart into user cart
 *
 * Logic:
 * - If both userId and sessionId: Merge guest cart into user cart
 * - If authenticated: Find by userId
 * - If guest: Find by sessionId
 * - If not found: Create new cart with userId or sessionId
 */
export async function getOrCreateCart(
  userId?: string,
  sessionId?: string
): Promise<CartType> {
  // Validate that at least one identifier is provided
  const hasIdentifier = userId || sessionId;
  if (!hasIdentifier) {
    throw new Error("Either userId or sessionId must be provided");
  }

  // Rule: Merge Carts - If both userId and sessionId, merge guest cart into user cart
  if (userId && sessionId) {
    return mergeGuestCartToUserCart(userId, sessionId);
  }

  // Build cache key
  const cacheKey = userId
    ? `cart:userId:${userId}`
    : `cart:sessionId:${sessionId}`;

  // Try to get from cache first
  const cached = await getCache<CartType>(cacheKey);
  if (cached) {
    return cached;
  }

  // Try to find existing cart
  let cart: CartType | null = null;

  if (userId) {
    // If authenticated, find by userId
    cart = await prisma.cart.findUnique({
      where: { userId },
    });
  } else if (sessionId) {
    // If guest, find by sessionId
    cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
  }

  // If cart not found, create a new one
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: userId || null,
        sessionId: sessionId || null,
      },
    });

    logger.info(
      {
        cartId: cart.id,
        userId: cart.userId,
        sessionId: cart.sessionId,
      },
      "Created new cart"
    );
  }

  // Cache the cart
  await setCache(cacheKey, cart, 300);

  return cart;
}

/**
 * Validate cart items on read
 * Rule: Validation on Read - Check stock, price, and product status
 */
type CartItemValidation = {
  itemId: string;
  variantId: string;
  issues: Array<{
    type: "stock" | "price" | "status";
    message: string;
  }>;
};

/**
 * Validate a single cart item
 */
function validateCartItem(item: {
  id: string;
  variantId: string;
  quantity: number;
  priceAtAdd: unknown;
  variant: {
    stockQuantity: number;
    price: unknown;
    salePrice: unknown | null;
    product: {
      status: string;
    };
  };
}): CartItemValidation | null {
  const issues: CartItemValidation["issues"] = [];

  // Check product status
  if (item.variant.product.status !== "PUBLISHED") {
    issues.push({
      type: "status",
      message: `Product is not available (status: ${item.variant.product.status})`,
    });
  }

  // Check stock quantity
  if (item.quantity > item.variant.stockQuantity) {
    issues.push({
      type: "stock",
      message: `Insufficient stock. Only ${item.variant.stockQuantity} items available, but cart has ${item.quantity}.`,
    });
  }

  // Check price (compare snapshot with current price)
  const currentPrice = Number(item.variant.salePrice || item.variant.price);
  const snapshotPrice = Number(item.priceAtAdd);
  const priceDiff = Math.abs(currentPrice - snapshotPrice);

  // If price difference is significant (more than 1% or 1000 VND)
  if (priceDiff > 0.01 * snapshotPrice || priceDiff > 1000) {
    issues.push({
      type: "price",
      message: `Price has changed from ${snapshotPrice.toLocaleString()} to ${currentPrice.toLocaleString()}`,
    });
  }

  if (issues.length === 0) {
    return null;
  }

  return {
    itemId: item.id,
    variantId: item.variantId,
    issues,
  };
}

/**
 * Get cart by ID with items and validation
 * Rule: Validation on Read - Validates stock, price, and product status
 */
export async function getCartById(cartId: string): Promise<
  | (CartType & {
      items: CartItemType[];
      validation?: {
        warnings: CartItemValidation[];
        errors: CartItemValidation[];
      };
    })
  | null
> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  defaultImage: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return null;
  }

  // Rule: Validation on Read
  const validationWarnings: CartItemValidation[] = [];
  const validationErrors: CartItemValidation[] = [];

  for (const item of cart.items) {
    const validation = validateCartItem(item);
    if (!validation) {
      continue;
    }

    // Status and stock issues are errors, price is warning
    const hasError = validation.issues.some(
      (i) => i.type === "status" || i.type === "stock"
    );
    if (hasError) {
      validationErrors.push(validation);
    } else {
      validationWarnings.push(validation);
    }
  }

  // Transform to match CartItemType
  const transformedCart = {
    ...cart,
    items: cart.items.map((item) => ({
      id: item.id,
      cartId: item.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtAdd: Number(item.priceAtAdd),
      createdAt: item.createdAt,
    })),
    ...(validationWarnings.length > 0 || validationErrors.length > 0
      ? {
          validation: {
            warnings: validationWarnings,
            errors: validationErrors,
          },
        }
      : {}),
  };

  // Only cache if no validation errors
  const cacheKey = `cart:${cartId}`;
  if (validationErrors.length === 0) {
    await setCache(cacheKey, transformedCart, 300);
  }

  return transformedCart;
}

/**
 * Add item to cart
 * Rule: Stock Check, Merge Quantity, Price Snapshot
 */
export async function addItemToCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<CartItemType> {
  // Get variant with product to check stock and status
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!variant) {
    throw new Error("Product variant not found");
  }

  // Rule: Validation on Read - Check product status
  if (variant.product.status !== "PUBLISHED") {
    throw new Error(
      `Product is not available (status: ${variant.product.status})`
    );
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId,
      variantId,
    },
  });

  // Calculate new quantity (Rule: Merge Quantity)
  const newQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  // Rule: Stock Check - Validate stock quantity
  if (newQuantity > variant.stockQuantity) {
    throw new Error(
      `Insufficient stock. Only ${variant.stockQuantity} items available in stock.`
    );
  }

  // Rule: Price Snapshot - Use salePrice if available, otherwise use price
  const currentPrice = variant.salePrice || variant.price;

  let cartItem: CartItemType;

  if (existingItem) {
    // Rule: Merge Quantity - Update existing item
    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        priceAtAdd: currentPrice, // Snapshot current price
      },
    });

    cartItem = {
      id: updated.id,
      cartId: updated.cartId,
      variantId: updated.variantId,
      quantity: updated.quantity,
      priceAtAdd: Number(updated.priceAtAdd),
      createdAt: updated.createdAt,
    };
  } else {
    // Create new item
    const created = await prisma.cartItem.create({
      data: {
        cartId,
        variantId,
        quantity,
        priceAtAdd: currentPrice, // Snapshot current price
      },
    });

    cartItem = {
      id: created.id,
      cartId: created.cartId,
      variantId: created.variantId,
      quantity: created.quantity,
      priceAtAdd: Number(created.priceAtAdd),
      createdAt: created.createdAt,
    };
  }

  // Invalidate cache
  await deleteCache(`cart:${cartId}`);
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
  });
  if (cart) {
    if (cart.userId) {
      await deleteCache(`cart:userId:${cart.userId}`);
    }
    if (cart.sessionId) {
      await deleteCache(`cart:sessionId:${cart.sessionId}`);
    }
  }

  return cartItem;
}

/**
 * Update cart item quantity
 * Rule: Stock Check
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartItemType> {
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  // Get cart item with variant to check stock
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // Rule: Validation on Read - Check product status
  if (cartItem.variant.product.status !== "PUBLISHED") {
    throw new Error(
      `Product is not available (status: ${cartItem.variant.product.status})`
    );
  }

  // Rule: Stock Check - Validate stock quantity
  if (quantity > cartItem.variant.stockQuantity) {
    throw new Error(
      `Insufficient stock. Only ${cartItem.variant.stockQuantity} items available in stock.`
    );
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  const result: CartItemType = {
    id: updated.id,
    cartId: updated.cartId,
    variantId: updated.variantId,
    quantity: updated.quantity,
    priceAtAdd: Number(updated.priceAtAdd),
    createdAt: updated.createdAt,
  };

  // Invalidate cache
  await deleteCache(`cart:${updated.cartId}`);
  const cart = await prisma.cart.findUnique({
    where: { id: updated.cartId },
  });
  if (cart) {
    if (cart.userId) {
      await deleteCache(`cart:userId:${cart.userId}`);
    }
    if (cart.sessionId) {
      await deleteCache(`cart:sessionId:${cart.sessionId}`);
    }
  }

  return result;
}

/**
 * Remove item from cart
 */
export async function removeCartItem(itemId: string): Promise<void> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  // Invalidate cache
  await deleteCache(`cart:${item.cartId}`);
  const cart = await prisma.cart.findUnique({
    where: { id: item.cartId },
  });
  if (cart) {
    if (cart.userId) {
      await deleteCache(`cart:userId:${cart.userId}`);
    }
    if (cart.sessionId) {
      await deleteCache(`cart:sessionId:${cart.sessionId}`);
    }
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  // Invalidate cache
  await deleteCache(`cart:${cartId}`);
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
  });
  if (cart) {
    if (cart.userId) {
      await deleteCache(`cart:userId:${cart.userId}`);
    }
    if (cart.sessionId) {
      await deleteCache(`cart:sessionId:${cart.sessionId}`);
    }
  }
}

/**
 * Clear cart after successful order creation
 * Rule: Clear on Checkout - After order is created, clear the cart
 *
 * @param userId - User ID who placed the order
 * @param sessionId - Optional session ID (for guest checkout, though unlikely)
 */
export async function clearCartAfterOrder(
  userId?: string,
  sessionId?: string
): Promise<void> {
  const hasIdentifier = userId || sessionId;
  if (!hasIdentifier) {
    throw new Error("Either userId or sessionId must be provided");
  }

  let cart: CartType | null = null;

  if (userId) {
    cart = await prisma.cart.findUnique({
      where: { userId },
    });
  } else if (sessionId) {
    cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
  }

  if (!cart) {
    // Cart doesn't exist, nothing to clear
    logger.info(
      { userId, sessionId },
      "Cart not found for clearing after order"
    );
    return;
  }

  // Delete all cart items (cart itself remains for history)
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  // Invalidate cache
  await deleteCache(`cart:${cart.id}`);
  if (cart.userId) {
    await deleteCache(`cart:userId:${cart.userId}`);
  }
  if (cart.sessionId) {
    await deleteCache(`cart:sessionId:${cart.sessionId}`);
  }

  logger.info(
    {
      cartId: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
    },
    "Cleared cart after successful order"
  );
}
