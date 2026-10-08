import { FiSearch, FiSliders, FiX } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";

export function ProductsHeader({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="vendo-products-header">
      {/* Title & Subtitle */}
      <div className="header-text-block">
        <h1 className="header-title">{t("productsTitle")}</h1>
        <p className="header-subtitle">{t("productsSubtitle")}</p>
      </div>

      {/* Search & Sort Controls Toolbar */}
      <div className="products-toolbar">
        {/* Search Bar */}
        <div className="toolbar-search-wrap">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder={t("searchProductsPlaceholder") || "ابحث في المنتجات..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("searchProductsPlaceholder") || "ابحث في المنتجات"}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange("")}
              aria-label={t("clearFilters") || "Clear"}
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="toolbar-sort-wrap">
          <label htmlFor="products-sort-select" className="sort-label">
            <FiSliders className="sort-icon" />
            <span>{t("sortBy")}:</span>
          </label>
          <select
            id="products-sort-select"
            className="toolbar-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="default">{t("sortDefault")}</option>
            <option value="price_asc">{t("sortPriceAsc")}</option>
            <option value="price_desc">{t("sortPriceDesc")}</option>
            <option value="newest">{t("sortNewest")}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ProductsHeader;
