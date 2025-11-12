import { deleteCache, getCache, setCache } from "@/lib/cache.helper";
import logger from "@/lib/logger";
import prisma from "@/lib/prisma";
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
 * Get cart by ID with items
 */
export async function getCartById(cartId: string): Promise<
  | (CartType & {
      items: CartItemType[];
    })
  | null
> {
  const cacheKey = `cart:${cartId}`;
  const cached = await getCache<CartType & { items: CartItemType[] }>(cacheKey);
  if (cached) {
    return cached;
  }

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
  };

  await setCache(cacheKey, transformedCart, 300);

  return transformedCart;
}

/**
 * Add item to cart
 */
export async function addItemToCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<CartItemType> {
  // Get variant to get current price
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new Error("Product variant not found");
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId,
      variantId,
    },
  });

  let cartItem: CartItemType;

  if (existingItem) {
    // Update quantity
    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        priceAtAdd: variant.price, // Update price to current price
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
        priceAtAdd: variant.price,
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
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartItemType> {
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  const cartItem: CartItemType = {
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

  return cartItem;
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
