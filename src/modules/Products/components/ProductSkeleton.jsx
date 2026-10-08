export function ProductSkeleton() {
  return (
    <div className="vendo-product-skeleton" aria-hidden="true">
      <div className="skeleton-media shimmer" />
      <div className="skeleton-content">
        <div className="skeleton-tag shimmer" />
        <div className="skeleton-title shimmer" />
        <div className="skeleton-desc shimmer" />
        <div className="skeleton-desc-short shimmer" />
        <div className="skeleton-price-row">
          <div className="skeleton-price shimmer" />
          <div className="skeleton-stock shimmer" />
        </div>
        <div className="skeleton-btn shimmer" />
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }) {
  return (
    <div className="vendo-products-grid" aria-label="Loading products">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductSkeleton key={idx} />
      ))}
    </div>
  );
}

export default ProductSkeleton;
