import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiArrowLeft, FiArrowRight, FiTrash2, FiShoppingBag } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { getWishlist, clearWishlist } from "@/modules/Products/utils/storefrontState";
import { getProducts } from "@/services/productService";
import ProductCard from "@/modules/Products/components/ProductCard";
import { ProductSkeletonGrid } from "@/modules/Products/components/ProductSkeleton";
import "@/modules/Products/Products.css";
import "./Wishlist.css";

export function WishlistPage() {
  const { isRTL } = useTranslation();

  // Wishlist local state
  const [wishlist, setWishlist] = useState(() => getWishlist());
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Sync with window events when items are toggled from cards or elsewhere
  useEffect(() => {
    const handleWishlistSync = () => {
      setWishlist(getWishlist());
    };
    window.addEventListener("vendo_wishlist_updated", handleWishlistSync);
    return () => window.removeEventListener("vendo_wishlist_updated", handleWishlistSync);
  }, []);

  // Fetch store catalog to enrich wishlist items with full images, reviews, stock, etc.
  useEffect(() => {
    let isMounted = true;
    getProducts()
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setCatalogProducts(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch catalog for wishlist enrichment:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingCatalog(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Enrich wishlist items with catalog data if available
  const enrichedProducts = wishlist.map((item) => {
    const matched = catalogProducts.find((p) => String(p.id) === String(item.id));
    if (matched) {
      return matched;
    }
    return {
      ...item,
      images: item.images?.length ? item.images : item.image ? [{ image: item.image }] : [],
      categories: item.categories || [],
      reviews: item.reviews || [],
      discount_price: item.discount_price || null,
      has_variants: Boolean(item.has_variants),
    };
  });

  const handleClearAll = () => {
    if (
      window.confirm(
        isRTL
          ? "هل أنت متأكد من رغبتك في إفراغ قائمة المفضلة بالكامل؟"
          : "Are you sure you want to clear all items from your wishlist?"
      )
    ) {
      clearWishlist();
    }
  };

  const handleWishlistChange = () => {
    setWishlist(getWishlist());
  };

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------
  if (wishlist.length === 0) {
    return (
      <div className="vendo-wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-empty-card">
            <div className="wishlist-empty-icon" aria-hidden="true">
              <FiHeart />
            </div>
            <h1 className="wishlist-empty-title">
              {isRTL ? "قائمة المفضلة فارغة" : "Your Wishlist is Empty"}
            </h1>
            <p className="wishlist-empty-desc">
              {isRTL
                ? "لم تقم بحفظ أي منتجات في المفضلة بعد. استكشف متجرنا واختر المنتجات التي تعجبك لحفظها والرجوع إليها بسهولة."
                : "You haven't saved any products to your wishlist yet. Explore our store and save what you love."}
            </p>
            <Link to="/shop" className="btn-wishlist-shop" id="btn-explore-shop-wishlist">
              <FiShoppingBag aria-hidden="true" />
              <span>{isRTL ? "تصفح أحدث المنتجات" : "Explore Latest Products"}</span>
              {isRTL ? <FiArrowLeft aria-hidden="true" /> : <FiArrowRight aria-hidden="true" />}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Active Wishlist Grid
  // -------------------------------------------------------------------------
  return (
    <div className="vendo-wishlist-page">
      <div className="wishlist-container">
        {/* Top Header */}
        <div className="wishlist-top-bar">
          <div className="wishlist-title-wrap">
            <h1 className="wishlist-title">
              <span className="wishlist-title-icon" aria-hidden="true">
                <FiHeart />
              </span>
              {isRTL ? "قائمة المفضلة" : "My Wishlist"}
            </h1>
            <span className="wishlist-count-badge">
              {wishlist.length} {isRTL ? "منتج" : "items"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="btn-clear-wishlist"
            title={isRTL ? "إفراغ المفضلة بالكامل" : "Clear Entire Wishlist"}
          >
            <FiTrash2 aria-hidden="true" />
            <span>{isRTL ? "إفراغ المفضلة" : "Clear All"}</span>
          </button>
        </div>

        {/* Products Grid or Loading Skeleton */}
        {loadingCatalog && wishlist.length > 0 && enrichedProducts[0]?.images?.length === 0 ? (
          <ProductSkeletonGrid count={wishlist.length} />
        ) : (
          <div className="vendo-products-grid">
            {enrichedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;
