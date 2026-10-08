/**
 * Lightweight local storage sync for Storefront Wishlist and Cart
 * Dispatches window events so Navbar badges and other components stay synced.
 */

const WISHLIST_KEY = "vendo_wishlist_items";
const CART_KEY = "vendo_cart_items";

// Wishlist helpers
export const getWishlist = () => {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isInWishlist = (productId) => {
  const items = getWishlist();
  return items.some((item) => String(item.id) === String(productId));
};

export const toggleWishlist = (product) => {
  if (!product?.id) return false;
  const current = getWishlist();
  const exists = current.some((item) => String(item.id) === String(product.id));

  let updated;
  let isAdded = false;

  if (exists) {
    updated = current.filter((item) => String(item.id) !== String(product.id));
  } else {
    const primaryImg =
      (Array.isArray(product.images) && product.images[0]?.image) ||
      (Array.isArray(product.images) && typeof product.images[0] === "string" && product.images[0]) ||
      product.image ||
      null;

    updated = [
      ...current,
      {
        id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        price: product.price,
        discount_price: product.discount_price || null,
        has_variants: Boolean(product.has_variants),
        image: primaryImg,
        images: product.images || (primaryImg ? [{ image: primaryImg }] : []),
        categories: product.categories || [],
      },
    ];
    isAdded = true;
  }

  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save wishlist to localStorage", e);
  }

  window.dispatchEvent(new CustomEvent("vendo_wishlist_updated", { detail: { count: updated.length, isAdded, product } }));
  return isAdded;
};

export const clearWishlist = () => {
  try {
    localStorage.removeItem(WISHLIST_KEY);
  } catch (e) {
    console.warn("Could not clear wishlist", e);
  }
  window.dispatchEvent(new CustomEvent("vendo_wishlist_updated", { detail: { count: 0, items: [] } }));
};

// Cart helpers
export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToCart = (product, quantity = 1, selectedVariant = null) => {
  if (!product?.id) return false;
  const current = getCart();

  const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : String(product.id);

  const existingIdx = current.findIndex((item) => item.cartItemId === cartItemId);

  let updated;
  if (existingIdx > -1) {
    updated = current.map((item, idx) =>
      idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
    );
  } else {
    updated = [
      ...current,
      {
        cartItemId,
        id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        price: product.price,
        image:
          (Array.isArray(product.images) && product.images[0]?.image) ||
          (Array.isArray(product.images) && typeof product.images[0] === "string" && product.images[0]) ||
          product.image ||
          null,
        variant: selectedVariant,
        quantity,
      },
    ];
  }

  try {
    localStorage.setItem(CART_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save cart to localStorage", e);
  }

  window.dispatchEvent(new CustomEvent("vendo_cart_updated", { detail: { count: updated.length, product, quantity } }));
  return true;
};

export const removeFromCart = (cartItemId) => {
  const current = getCart();
  const updated = current.filter((item) => item.cartItemId !== cartItemId);
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not remove item from cart", e);
  }
  window.dispatchEvent(new CustomEvent("vendo_cart_updated", { detail: { count: updated.length } }));
  return updated;
};

export const updateCartQuantity = (cartItemId, newQuantity) => {
  if (newQuantity <= 0) {
    return removeFromCart(cartItemId);
  }
  const current = getCart();
  const updated = current.map((item) =>
    item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
  );
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not update cart quantity", e);
  }
  window.dispatchEvent(new CustomEvent("vendo_cart_updated", { detail: { count: updated.length } }));
  return updated;
};

export const clearCart = () => {
  try {
    localStorage.removeItem(CART_KEY);
  } catch (e) {
    console.warn("Could not clear cart", e);
  }
  window.dispatchEvent(new CustomEvent("vendo_cart_updated", { detail: { count: 0, items: [] } }));
};
