import { FiPercent } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";

export function OffersSection({ offers = [], isLoading = false, onWishlistChange }) {
  const { t } = useTranslation();

  // If not loading and no offers available, do not render section
  if (!isLoading && (!offers || offers.length === 0)) {
    return null;
  }

  return (
    <section className="vendo-offers-section" aria-label={t("featuredOffers")}>
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-badge-pill">
            <FiPercent className="section-badge-icon" />
            <span>{t("featuredOffersBadge") || "توفير خاص"}</span>
          </div>
          <h2 className="section-heading">{t("featuredOffers")}</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="vendo-products-grid offers-grid">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      ) : (
        <div className="vendo-products-grid offers-grid">
          {offers.map((product) => (
            <ProductCard
              key={`offer-${product.id}`}
              product={product}
              onWishlistChange={onWishlistChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default OffersSection;
