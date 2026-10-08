import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiStar, FiSliders } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getLocalizedName,
  getLocalizedDesc,
  getPrimaryImage,
  getSecondaryImage,
  formatPrice,
  getDiscountInfo,
  getStockInfo,
  getRatingSummary,
  getCategoryTags,
  FALLBACK_PRODUCT_IMAGE,
} from "../utils/productHelpers";
import { isInWishlist, toggleWishlist, addToCart } from "../utils/storefrontState";

export function ProductCard({ product, onWishlistChange }) {
  const { t, language, isRTL } = useTranslation();
  const navigate = useNavigate();

  const [inWishlist, setInWishlist] = useState(() => isInWishlist(product?.id));
  const [imgSrc, setImgSrc] = useState(() => getPrimaryImage(product));
  const [isHovered, setIsHovered] = useState(false);

  if (!product) return null;

  const title = getLocalizedName(product, language);
  const description = getLocalizedDesc(product, language);
  const discountInfo = getDiscountInfo(product, language);
  const stockInfo = getStockInfo(product, language);
  const ratingInfo = getRatingSummary(product.reviews);
  const categoryTags = getCategoryTags(product.categories, language);
  const secondaryImage = getSecondaryImage(product);

  const productUrl = `/products/${product.id}`;

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    setInWishlist(added);
    if (added) {
      toast.success(t("addedToWishlist") || "تمت إضافة المنتج للمفضلة");
    } else {
      toast(t("removedFromWishlist") || "تمت إزالة المنتج من المفضلة", { icon: "💔" });
    }
    if (onWishlistChange) {
      onWishlistChange(product.id, added);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (stockInfo.actionType === "choose_options") {
      navigate(productUrl);
      return;
    }

    if (stockInfo.canAddToCart) {
      addToCart(product, 1);
      toast.success(t("addedToCart") || "تمت إضافة المنتج إلى السلة بنجاح");
    }
  };

  return (
    <article
      className="vendo-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual / Media Container */}
      <div className="product-card-media">
        {/* Badges Overlay */}
        <div className="product-badges-overlay">
          {discountInfo && (
            <span className="product-badge-discount" aria-label={discountInfo.fullText}>
              {discountInfo.badgeText}
            </span>
          )}

          {stockInfo.hasVariants && (
            <span className="product-badge-variants">
              {t("multipleOptions")}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          className={`product-wishlist-btn ${inWishlist ? "active" : ""}`}
          onClick={handleWishlistToggle}
          aria-label={inWishlist ? (isRTL ? "إزالة من المفضلة" : "Remove from wishlist") : (isRTL ? "إضافة إلى المفضلة" : "Add to wishlist")}
          title={inWishlist ? (isRTL ? "إزالة من المفضلة" : "Remove from wishlist") : (isRTL ? "إضافة إلى المفضلة" : "Add to wishlist")}
        >
          {inWishlist ? (
            <FaHeart className="wishlist-icon filled" />
          ) : (
            <FiHeart className="wishlist-icon" />
          )}
        </button>

        {/* Product Image Link */}
        <Link to={productUrl} className="product-card-img-link" tabIndex={-1} aria-hidden="true">
          <img
            src={isHovered && secondaryImage ? secondaryImage : imgSrc}
            alt={title}
            className={`product-card-img ${isHovered && secondaryImage ? "has-secondary" : ""}`}
            loading="lazy"
            onError={() => {
              if (imgSrc !== FALLBACK_PRODUCT_IMAGE) {
                setImgSrc(FALLBACK_PRODUCT_IMAGE);
              }
            }}
          />
        </Link>
      </div>

      {/* Product Content Body */}
      <div className="product-card-content">
        {/* Categories Snippet */}
        {categoryTags.length > 0 && (
          <div className="product-card-categories">
            {categoryTags.map((cat, idx) => (
              <span key={cat.id} className="product-card-category-tag">
                {cat.name}
                {idx < categoryTags.length - 1 && <span className="cat-separator">•</span>}
              </span>
            ))}
          </div>
        )}

        {/* Product Title */}
        <h3 className="product-card-title">
          <Link to={productUrl} className="product-card-title-link" title={title}>
            {title}
          </Link>
        </h3>

        {/* Optional Rating (Only rendered if reviews exist) */}
        {ratingInfo && (
          <div className="product-card-rating" aria-label={`Rating: ${ratingInfo.avgRating} out of 5 stars`}>
            <FiStar className="rating-star-icon" />
            <span className="rating-score">{ratingInfo.avgRating}</span>
            <span className="rating-count">({ratingInfo.count})</span>
          </div>
        )}

        {/* Short Description (Clamped to 2 lines) */}
        {description && (
          <p className="product-card-desc" title={description}>
            {description}
          </p>
        )}

        {/* Price & Stock Section */}
        <div className="product-card-pricing-row">
          <div className="product-card-prices">
            <span className="product-current-price">{formatPrice(product.price, language)}</span>
            {product.old_price && Number(product.old_price) > Number(product.price) && (
              <span className="product-old-price">{formatPrice(product.old_price, language)}</span>
            )}
          </div>

          <div className="product-card-stock-status">
            <span className={`stock-status-dot ${stockInfo.statusClass}`} />
            <span className={`stock-status-text ${stockInfo.statusClass}`}>{stockInfo.statusLabel}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="product-card-action">
          {stockInfo.actionType === "choose_options" ? (
            <Link
              to={productUrl}
              className="product-card-btn btn-choose-options"
              aria-label={`${t("chooseOptions")} - ${title}`}
            >
              <FiSliders className="btn-icon" />
              <span>{t("chooseOptions")}</span>
            </Link>
          ) : (
            <button
              type="button"
              className={`product-card-btn btn-add-cart ${stockInfo.isBtnDisabled ? "disabled" : ""}`}
              onClick={handleAddToCart}
              disabled={stockInfo.isBtnDisabled}
              aria-label={`${stockInfo.btnLabel} - ${title}`}
            >
              <FiShoppingCart className="btn-icon" />
              <span>{stockInfo.btnLabel}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
