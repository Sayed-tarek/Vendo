import { useTranslation } from "@/hooks/useTranslation";
import { FiGrid } from "react-icons/fi";

export function CategoryFilter({
  categories = [],
  activeCategoryId = "all",
  onSelectCategory,
  isLoading = false,
  totalCount = 0,
}) {
  const { t, language } = useTranslation();
  const isAr = language === "ar";

  if (isLoading) {
    return (
      <div className="category-filter-bar" aria-label="Loading categories">
        <div className="category-filter-scroll">
          <div className="category-pill-skeleton shimmer" />
          <div className="category-pill-skeleton shimmer" />
          <div className="category-pill-skeleton shimmer" />
          <div className="category-pill-skeleton shimmer" />
          <div className="category-pill-skeleton shimmer" />
        </div>
      </div>
    );
  }

  return (
    <nav className="category-filter-bar" aria-label={t("categoryLabel") || "Categories"}>
      <div className="category-filter-scroll">
        {/* All Categories Option */}
        <button
          type="button"
          className={`category-pill ${activeCategoryId === "all" ? "active" : ""}`}
          onClick={() => onSelectCategory("all")}
          aria-pressed={activeCategoryId === "all"}
        >
          <FiGrid className="category-pill-icon" />
          <span>{t("all")}</span>
          {totalCount > 0 && <span className="category-pill-badge">{totalCount}</span>}
        </button>

        {/* Dynamically Loaded Categories */}
        {categories.map((cat) => {
          const categoryName = isAr ? cat.name_ar || cat.name_en : cat.name_en || cat.name_ar;
          const isActive = String(activeCategoryId) === String(cat.id);

          return (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${isActive ? "active" : ""}`}
              onClick={() => onSelectCategory(cat.id)}
              aria-pressed={isActive}
            >
              {cat.image && (
                <img
                  src={cat.image}
                  alt=""
                  className="category-pill-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <span>{categoryName}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default CategoryFilter;
