import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowRight,
  FiArrowLeft,
  FiShoppingCart,
  FiHeart,
  FiAlertCircle,
  FiRefreshCw,
  FiMessageSquare,
  FiCheck,
} from "react-icons/fi";
import { FaHeart, FaStar, FaRegStar } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { getProductDetails } from "@/services/productService";
import ProductReviews from "./ProductReviews";
import {
  getLocalizedName,
  getLocalizedDesc,
  getPrimaryImage,
  formatPrice,
  getDiscountInfo,
  getRatingSummary,
  getCategoryTags,
  extractUniqueColors,
  extractUniqueSizes,
  findVariant,
  isSizeAvailable,
  FALLBACK_PRODUCT_IMAGE,
} from "../utils/productHelpers";
import { isInWishlist, toggleWishlist, addToCart } from "../utils/storefrontState";

export function ProductDetails() {
  const { id } = useParams();
  const { t, language, isRTL } = useTranslation();

  // Data states
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState(null);

  // Variant selection states
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);

  // Fetch product data
  const fetchDetails = () => {
    setLoading(true);
    setError(null);

    getProductDetails(id)
      .then((res) => {
        if (res && res.data) {
          const prodData = res.data;
          setProduct(prodData);
          setInWishlist(isInWishlist(prodData.id));
          setSelectedImage(getPrimaryImage(prodData));

          // Auto-select initial variant if has variants
          if (prodData.has_variants && Array.isArray(prodData.variants) && prodData.variants.length > 0) {
            const firstInStock = prodData.variants.find((v) => v.status === true && Number(v.quantity) > 0) || prodData.variants[0];
            setSelectedColorId(firstInStock.color_id || firstInStock.color?.id || null);
            setSelectedSizeId(firstInStock.size_id || firstInStock.size?.id || null);
          }
        } else {
          setError(t("productNotFound") || "المنتج غير موجود");
        }
      })
      .catch((err) => {
        console.error("Product details API error:", err);
        if (err?.response?.status === 404) {
          setError(t("productNotFound") || "المنتج غير موجود");
        } else {
          setError(err?.response?.data?.message || t("errorLoadingProducts") || "تعذر تحميل المنتج.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Refresh product details and reviews silently without full-page skeleton flicker
  const refreshProductDetails = async () => {
    try {
      const res = await getProductDetails(id);
      if (res && res.data) {
        setProduct(res.data);
      }
    } catch (err) {
      console.warn("Could not refresh product details:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getProductDetails(id)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          const prodData = res.data;
          setProduct(prodData);
          setInWishlist(isInWishlist(prodData.id));
          setSelectedImage(getPrimaryImage(prodData));

          // Auto-select initial variant if has variants
          if (prodData.has_variants && Array.isArray(prodData.variants) && prodData.variants.length > 0) {
            const firstInStock = prodData.variants.find((v) => v.status === true && Number(v.quantity) > 0) || prodData.variants[0];
            setSelectedColorId(firstInStock.color_id || firstInStock.color?.id || null);
            setSelectedSizeId(firstInStock.size_id || firstInStock.size?.id || null);
          }
        } else {
          setError(t("productNotFound") || "المنتج غير موجود");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Product details API error:", err);
        if (err?.response?.status === 404) {
          setError(t("productNotFound") || "المنتج غير موجود");
        } else {
          setError(err?.response?.data?.message || t("errorLoadingProducts") || "تعذر تحميل المنتج.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, t]);

  // Extract unique colors and sizes
  const colors = useMemo(() => {
    return product?.variants ? extractUniqueColors(product.variants, language) : [];
  }, [product, language]);

  const sizes = useMemo(() => {
    return product?.variants ? extractUniqueSizes(product.variants) : [];
  }, [product]);

  // Matched variant
  const selectedVariant = useMemo(() => {
    if (!product?.has_variants || !product?.variants) return null;
    return findVariant(product.variants, selectedColorId, selectedSizeId);
  }, [product, selectedColorId, selectedSizeId]);

  // Max selectable quantity
  const maxStock = useMemo(() => {
    if (!product) return 0;
    if (product.has_variants) {
      return selectedVariant ? Number(selectedVariant.quantity) || 0 : 0;
    }
    return Number(product.quantity) || 0;
  }, [product, selectedVariant]);

  // Availability evaluation
  const isAvailable = useMemo(() => {
    if (!product || product.status === false) return false;
    if (product.has_variants) {
      if (!selectedVariant) return false;
      return selectedVariant.status === true && Number(selectedVariant.quantity) > 0;
    }
    return Number(product.quantity) > 0;
  }, [product, selectedVariant]);

  // Wishlist toggle handler
  const handleWishlistToggle = () => {
    if (!product) return;
    const added = toggleWishlist(product);
    setInWishlist(added);
    if (added) {
      toast.success(t("addedToWishlist") || "تمت إضافة المنتج للمفضلة");
    } else {
      toast(t("removedFromWishlist") || "تمت إزالة المنتج من المفضلة", { icon: "💔" });
    }
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;

    if (product.has_variants) {
      if (!selectedVariant) {
        toast.error(t("selectVariantFirst") || "يرجى اختيار اللون والمقاس أولاً");
        return;
      }
      if (!isAvailable) {
        toast.error(t("outOfStock") || "نفد المخزون");
        return;
      }
      addToCart(product, quantity, selectedVariant);
    } else {
      if (!isAvailable) {
        toast.error(t("outOfStock") || "نفد المخزون");
        return;
      }
      addToCart(product, quantity, null);
    }

    toast.success(t("addedToCart") || "تمت إضافة المنتج إلى السلة بنجاح");
  };

  // Quantity handlers
  const handleQuantityIncrement = () => {
    if (quantity < maxStock) {
      setQuantity((q) => q + 1);
    } else {
      toast(t("maxQuantityReached") || "تم الوصول للحد الأقصى للكمية المتوفرة", { icon: "⚠️" });
    }
  };

  const handleQuantityDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  // ----------------------------------------------------
  // SKELETON LOADING STATE
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="vendo-details-page">
        <div className="vendo-container">
          <div className="details-breadcrumb-skeleton shimmer" />
          <div className="details-grid">
            <div className="details-gallery-skeleton">
              <div className="details-main-img-skeleton shimmer" />
              <div className="details-thumbs-skeleton">
                <div className="thumb-skeleton shimmer" />
                <div className="thumb-skeleton shimmer" />
                <div className="thumb-skeleton shimmer" />
              </div>
            </div>
            <div className="details-info-skeleton">
              <div className="skeleton-title shimmer" style={{ width: "70%", height: "32px" }} />
              <div className="skeleton-price shimmer" style={{ width: "35%", height: "28px", marginTop: "1rem" }} />
              <div className="skeleton-desc shimmer" style={{ width: "100%", height: "80px", marginTop: "1.5rem" }} />
              <div className="skeleton-btn shimmer" style={{ width: "100%", height: "50px", marginTop: "2rem" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ERROR & 404 NOT FOUND STATE
  // ----------------------------------------------------
  if (error || !product) {
    const isNotFound = error === (t("productNotFound") || "المنتج غير موجود");
    return (
      <div className="vendo-details-page">
        <div className="vendo-container" style={{ padding: "4rem 1rem", textAlign: "center", minHeight: "65vh" }}>
          <div className="products-error-state" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div className="state-icon-wrap">
              <FiAlertCircle />
            </div>
            <h2 className="state-title">{error || t("productNotFound")}</h2>
            <p className="state-desc">
              {isNotFound
                ? t("productNotFoundDesc") || "قد يكون تم حذف المنتج أو لم يعد متاحًا حاليًا."
                : t("errorLoadingProducts") || "تعذر تحميل بيانات المنتج."}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                to="/products"
                className="state-retry-btn"
                style={{ textDecoration: "none" }}
              >
                {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
                <span>{t("backToProducts")}</span>
              </Link>
              {!isNotFound && (
                <button
                  type="button"
                  className="state-retry-btn"
                  onClick={fetchDetails}
                  style={{ backgroundColor: "var(--vendo-gray-secondary)" }}
                >
                  <FiRefreshCw />
                  <span>{t("retry")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Localized values
  const title = getLocalizedName(product, language);
  const description = getLocalizedDesc(product, language);
  const discountInfo = getDiscountInfo(product, language);
  const ratingInfo = getRatingSummary(product.reviews);
  const categoryTags = getCategoryTags(product.categories, language);
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [{ image: FALLBACK_PRODUCT_IMAGE }];
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];

  return (
    <div className="vendo-details-page">
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      <div className="vendo-container">
        {/* 1. Breadcrumbs */}
        <nav className="details-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">
            {t("navHome")}
          </Link>
          <span className="breadcrumb-separator">{isRTL ? "‹" : "›"}</span>
          <Link to="/products" className="breadcrumb-link">
            {t("products")}
          </Link>
          <span className="breadcrumb-separator">{isRTL ? "‹" : "›"}</span>
          <span className="breadcrumb-current" aria-current="page">
            {title}
          </span>
        </nav>

        {/* 2. Main Two-Column Layout */}
        <div className="details-grid">
          {/* Gallery Media Column */}
          <div className="details-gallery">
            {/* Main Display Image */}
            <div className="details-main-image-wrap">
              {discountInfo && (
                <span className="product-badge-discount details-discount-badge">
                  {discountInfo.fullText}
                </span>
              )}

              <img
                src={selectedImage || FALLBACK_PRODUCT_IMAGE}
                alt={title}
                className="details-main-img"
                onError={() => setSelectedImage(FALLBACK_PRODUCT_IMAGE)}
              />
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="details-thumbnails-strip" aria-label="Product thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    className={`details-thumb-btn ${selectedImage === img.image ? "active" : ""}`}
                    onClick={() => setSelectedImage(img.image)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img.image}
                      alt=""
                      className="details-thumb-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Actions Column */}
          <div className="details-info-wrap">
            {/* Category Badges */}
            {categoryTags.length > 0 && (
              <div className="details-categories-row">
                {categoryTags.map((cat) => (
                  <span key={cat.id} className="details-category-pill">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Product Title */}
            <h1 className="details-product-title">{title}</h1>

            {/* Rating Summary Strip */}
            <div className="details-rating-strip">
              {ratingInfo ? (
                <>
                  <div className="rating-stars-list">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="rating-star">
                        {star <= Math.round(ratingInfo.avgRating) ? (
                          <FaStar className="star-icon filled" />
                        ) : (
                          <FaRegStar className="star-icon empty" />
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="rating-score-num">{ratingInfo.avgRating}</span>
                  <span className="rating-count-text">
                    ({ratingInfo.count} {t("reviewsCount")})
                  </span>
                </>
              ) : (
                <span className="no-rating-subtle">
                  <FiMessageSquare /> {t("noReviews")}
                </span>
              )}
            </div>

            {/* Pricing Row */}
            <div className="details-pricing-box">
              <span className="details-current-price">{formatPrice(product.price, language)}</span>
              {product.old_price && Number(product.old_price) > Number(product.price) && (
                <span className="details-old-price">{formatPrice(product.old_price, language)}</span>
              )}
              {discountInfo && (
                <span className="details-save-badge">{discountInfo.badgeText}</span>
              )}
            </div>

            {/* Status & Stock Availability */}
            <div className="details-stock-status-bar">
              <span className={`stock-status-dot ${isAvailable ? "stock-available" : "stock-out"}`} />
              <span className={`stock-status-text ${isAvailable ? "stock-available" : "stock-out"}`}>
                {isAvailable ? t("available") : t("outOfStock")}
              </span>
              {isAvailable && maxStock > 0 && (
                <span className="stock-quantity-hint">
                  ({maxStock} {t("inStockCount")})
                </span>
              )}
            </div>

            {/* VARIANTS SELECTION (If Product Has Variants) */}
            {product.has_variants && (
              <div className="details-variants-container">
                {/* 1. Color Selector */}
                {colors.length > 0 && (
                  <div className="variant-field-group">
                    <label className="variant-field-label">
                      <span>{t("colorLabel")}:</span>
                      <strong className="variant-selected-value">
                        {colors.find((c) => String(c.id) === String(selectedColorId))?.name || ""}
                      </strong>
                    </label>
                    <div className="variant-options-chips">
                      {colors.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`variant-chip-btn color-chip ${String(selectedColorId) === String(c.id) ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedColorId(c.id);
                            setQuantity(1);
                          }}
                        >
                          <FiCheck className="chip-check-icon" />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Size Selector */}
                {sizes.length > 0 && (
                  <div className="variant-field-group">
                    <label className="variant-field-label">
                      <span>{t("sizeLabel")}:</span>
                      <strong className="variant-selected-value">
                        {sizes.find((s) => String(s.id) === String(selectedSizeId))?.name || ""}
                      </strong>
                    </label>
                    <div className="variant-options-chips">
                      {sizes.map((s) => {
                        const inStockForColor = isSizeAvailable(product.variants, s.id, selectedColorId);
                        const isSelected = String(selectedSizeId) === String(s.id);

                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={`variant-chip-btn size-chip ${isSelected ? "selected" : ""} ${!inStockForColor ? "disabled" : ""}`}
                            onClick={() => {
                              if (inStockForColor) {
                                setSelectedSizeId(s.id);
                                setQuantity(1);
                              }
                            }}
                            disabled={!inStockForColor}
                            aria-label={`${s.name} ${!inStockForColor ? `(${t("outOfStock")})` : ""}`}
                          >
                            <span>{s.name}</span>
                            {!inStockForColor && <span className="size-chip-out-line" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="details-actions-wrapper">
              {/* Quantity Counter */}
              <div className="details-qty-counter-block">
                <label className="qty-counter-label">{t("quantityLabel")}:</label>
                <div className="details-qty-counter">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleQuantityDecrement}
                    disabled={quantity <= 1 || !isAvailable}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="qty-value" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleQuantityIncrement}
                    disabled={quantity >= maxStock || !isAvailable}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart & Wishlist Buttons */}
              <div className="details-cta-row">
                <button
                  type="button"
                  className={`product-card-btn btn-add-cart details-add-cart-btn ${!isAvailable ? "disabled" : ""}`}
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                >
                  <FiShoppingCart className="btn-icon" />
                  <span>{isAvailable ? t("addToCart") : t("outOfStock")}</span>
                </button>

                <button
                  type="button"
                  className={`details-wishlist-btn ${inWishlist ? "active" : ""}`}
                  onClick={handleWishlistToggle}
                  aria-label={t("wishlist")}
                  title={t("wishlist")}
                >
                  {inWishlist ? (
                    <FaHeart className="wishlist-icon filled" />
                  ) : (
                    <FiHeart className="wishlist-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Full Product Description */}
            {description && (
              <div className="details-desc-section">
                <h2 className="details-section-title">{t("description")}</h2>
                <div className="details-desc-content">
                  <p>{description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Customer Reviews Section */}
        <ProductReviews
          productId={product.id || id}
          reviews={reviews}
          ratingInfo={ratingInfo}
          onReviewSubmitted={refreshProductDetails}
        />
      </div>
    </div>
  );
}

export default ProductDetails;
