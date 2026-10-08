/**
 * Reusable helper functions for normalizing and formatting product data
 */

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22400%22%2F%3E%3Cpath%20d%3D%22M150%20140h100v120H150z%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%228%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M175%20140a25%2025%200%200%201%2050%200%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%228%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22185%22%20r%3D%2212%22%20fill%3D%22%23cbd5e1%22%2F%3E%3Cpath%20d%3D%22M155%20245l30-30%2020%2020%2035-35%2010%2010%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E";

/**
 * Get localized product title
 */
export const getLocalizedName = (product, language = "ar") => {
  if (!product) return "";
  if (language === "ar") {
    return product.name_ar || product.name_en || "";
  }
  return product.name_en || product.name_ar || "";
};

/**
 * Get localized product description
 */
export const getLocalizedDesc = (product, language = "ar") => {
  if (!product) return "";
  if (language === "ar") {
    return product.description_ar || product.description_en || "";
  }
  return product.description_en || product.description_ar || "";
};

/**
 * Get primary image url with fallback
 */
export const getPrimaryImage = (product) => {
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images[0]?.image;
    if (primary && typeof primary === "string" && primary.trim() !== "") {
      return primary;
    }
  }
  return FALLBACK_PRODUCT_IMAGE;
};

/**
 * Get secondary image url for subtle hover if available
 */
export const getSecondaryImage = (product) => {
  if (product?.images && Array.isArray(product.images) && product.images.length > 1) {
    const secondary = product.images[1]?.image;
    if (secondary && typeof secondary === "string" && secondary.trim() !== "") {
      return secondary;
    }
  }
  return null;
};

/**
 * Format currency price
 */
export const formatPrice = (price, language = "ar") => {
  const num = Number(price) || 0;
  const formatted = num.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const symbol = language === "ar" ? "ج.م" : "EGP";
  return `${formatted} ${symbol}`;
};

/**
 * Calculate and format discount display
 */
export const getDiscountInfo = (product, language = "ar") => {
  if (!product) return null;

  // 1. Direct discount percentage from API
  if (product.discount_percentage) {
    const raw = String(product.discount_percentage).trim();
    const clean = raw.endsWith("%") ? raw : `${raw}%`;
    return {
      hasDiscount: true,
      badgeText: clean.startsWith("-") ? clean : `-${clean}`,
      fullText: language === "ar" ? `خصم ${clean}` : `${clean} OFF`,
    };
  }

  // 2. Computed from old_price vs price
  if (product.old_price && Number(product.old_price) > Number(product.price)) {
    const oldP = Number(product.old_price);
    const currP = Number(product.price);
    const pct = Math.round(((oldP - currP) / oldP) * 100);
    if (pct > 0) {
      return {
        hasDiscount: true,
        badgeText: `-${pct}%`,
        fullText: language === "ar" ? `خصم ${pct}%` : `${pct}% OFF`,
      };
    }
  }

  return null;
};

/**
 * Determine stock status, badge, and CTA action
 */
export const getStockInfo = (product, language = "ar") => {
  const isAr = language === "ar";

  // Inactive product status
  if (product?.status === false) {
    return {
      isAvailable: false,
      hasVariants: false,
      canAddToCart: false,
      statusLabel: isAr ? "غير متاح" : "Unavailable",
      statusClass: "stock-unavailable",
      btnLabel: isAr ? "غير متاح" : "Unavailable",
      isBtnDisabled: true,
      actionType: "disabled",
    };
  }

  // Product has variants
  if (product?.has_variants === true) {
    // Total quantity across variants or root status
    const totalVariantQty = Array.isArray(product?.variants)
      ? product.variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0)
      : 0;

    const hasStock = totalVariantQty > 0 || (product?.quantity && Number(product.quantity) > 0);

    return {
      isAvailable: hasStock,
      hasVariants: true,
      canAddToCart: false, // Must navigate to options
      statusLabel: hasStock ? (isAr ? "متوفر" : "In Stock") : (isAr ? "نفد المخزون" : "Out of Stock"),
      statusClass: hasStock ? "stock-available" : "stock-out",
      btnLabel: isAr ? "اختر الخيارات" : "Choose Options",
      isBtnDisabled: false,
      actionType: "choose_options",
    };
  }

  // Simple product without variants
  const qty = Number(product?.quantity) || 0;
  if (qty > 0) {
    return {
      isAvailable: true,
      hasVariants: false,
      canAddToCart: true,
      statusLabel: isAr ? "متوفر" : "In Stock",
      statusClass: "stock-available",
      btnLabel: isAr ? "أضف للسلة" : "Add to Cart",
      isBtnDisabled: false,
      actionType: "add_to_cart",
    };
  }

  return {
    isAvailable: false,
    hasVariants: false,
    canAddToCart: false,
    statusLabel: isAr ? "نفد المخزون" : "Out of Stock",
    statusClass: "stock-out",
    btnLabel: isAr ? "نفد المخزون" : "Out of Stock",
    isBtnDisabled: true,
    actionType: "disabled",
  };
};

/**
 * Compute average rating from reviews array if available
 */
export const getRatingSummary = (reviews) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  const validReviews = reviews.filter((r) => r && typeof r.rating !== "undefined" && !isNaN(Number(r.rating)));
  if (validReviews.length === 0) return null;

  const total = validReviews.reduce((acc, r) => acc + Number(r.rating), 0);
  const avg = total / validReviews.length;

  return {
    avgRating: Math.round(avg * 10) / 10,
    count: validReviews.length,
  };
};

/**
 * Format category tags (1 or 2 categories max)
 */
export const getCategoryTags = (categories, language = "ar") => {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return [];
  }
  const isAr = language === "ar";
  return categories.slice(0, 2).map((cat) => ({
    id: cat.id,
    name: isAr ? cat.name_ar || cat.name_en : cat.name_en || cat.name_ar,
  }));
};

/**
 * Extract unique color options from variants
 */
export const extractUniqueColors = (variants, language = "ar") => {
  if (!variants || !Array.isArray(variants)) return [];
  const map = new Map();
  const isAr = language === "ar";

  variants.forEach((v) => {
    if (v.color && v.color.id && !map.has(v.color.id)) {
      map.set(v.color.id, {
        id: v.color.id,
        name: isAr ? v.color.name_ar || v.color.name_en : v.color.name_en || v.color.name_ar,
      });
    }
  });

  return Array.from(map.values());
};

/**
 * Extract unique size options from variants
 */
export const extractUniqueSizes = (variants) => {
  if (!variants || !Array.isArray(variants)) return [];
  const map = new Map();

  variants.forEach((v) => {
    if (v.size && v.size.id && !map.has(v.size.id)) {
      map.set(v.size.id, {
        id: v.size.id,
        name: v.size.name,
      });
    }
  });

  return Array.from(map.values());
};

/**
 * Find matching variant by color ID and size ID
 */
export const findVariant = (variants, colorId, sizeId) => {
  if (!variants || !Array.isArray(variants)) return null;
  return (
    variants.find((v) => {
      const matchColor = !colorId || String(v.color_id) === String(colorId) || String(v.color?.id) === String(colorId);
      const matchSize = !sizeId || String(v.size_id) === String(sizeId) || String(v.size?.id) === String(sizeId);
      return matchColor && matchSize;
    }) || null
  );
};

/**
 * Check if a size has stock for a given color
 */
export const isSizeAvailable = (variants, sizeId, colorId = null) => {
  if (!variants || !Array.isArray(variants)) return false;
  const match = variants.find((v) => {
    const matchSize = String(v.size_id) === String(sizeId) || String(v.size?.id) === String(sizeId);
    const matchColor = !colorId || String(v.color_id) === String(colorId) || String(v.color?.id) === String(colorId);
    return matchSize && matchColor;
  });
  return Boolean(match && match.status === true && Number(match.quantity) > 0);
};
