import { useState, useEffect, useMemo, useCallback } from "react";
import { FiAlertCircle, FiPackage, FiRefreshCw } from "react-icons/fi";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { getProducts, getHomeCategories, getOffers } from "@/services/productService";
import ProductCard from "./components/ProductCard";
import { ProductSkeletonGrid } from "./components/ProductSkeleton";
import CategoryFilter from "./components/CategoryFilter";
import OffersSection from "./components/OffersSection";
import ProductsHeader from "./components/ProductsHeader";
import "./Products.css";

export function ProductsPage() {
  const { t, isRTL } = useTranslation();

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);

  // Loading states (independent as required)
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Error states
  const [errorProducts, setErrorProducts] = useState(null);

  // Filters & sorting
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Fetch Products
  const fetchProductsList = useCallback(() => {
    setLoadingProducts(true);
    setErrorProducts(null);

    getProducts()
      .then((res) => {
        if (res && res.data) {
          setProducts(Array.isArray(res.data) ? res.data : []);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Products API error:", err);
        const msg = err?.response?.data?.message || t("errorLoadingProducts") || "تعذر تحميل المنتجات.";
        setErrorProducts(msg);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, [t]);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    getProducts()
      .then((res) => {
        if (!isMounted) return;
        setProducts(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Products API error:", err);
        const msg = err?.response?.data?.message || t("errorLoadingProducts") || "تعذر تحميل المنتجات.";
        setErrorProducts(msg);
      })
      .finally(() => {
        if (isMounted) setLoadingProducts(false);
      });

    getHomeCategories()
      .then((res) => {
        if (!isMounted) return;
        setCategories(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        console.warn("Categories API failed (products unaffected):", err);
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    getOffers()
      .then((res) => {
        if (!isMounted) return;
        setOffers(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        console.warn("Offers API failed (products unaffected):", err);
      })
      .finally(() => {
        if (isMounted) setLoadingOffers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  // Filter & sort products client-side
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    let result = [...products];

    // 1. Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => {
        if (!p.categories || !Array.isArray(p.categories)) return false;
        return p.categories.some((cat) => String(cat.id) === String(selectedCategory));
      });
    }

    // 2. Filter by search query
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        const nameAr = (p.name_ar || "").toLowerCase();
        const nameEn = (p.name_en || "").toLowerCase();
        const descAr = (p.description_ar || "").toLowerCase();
        const descEn = (p.description_en || "").toLowerCase();
        return (
          nameAr.includes(q) ||
          nameEn.includes(q) ||
          descAr.includes(q) ||
          descEn.includes(q)
        );
      });
    }

    // 3. Sorting
    if (sortBy === "price_asc") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSortBy("default");
  };

  return (
    <div className="vendo-products-page">
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      <div className="vendo-container">
        {/* Page Header (Title, Subtitle, Search, Sort) */}
        <ProductsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalResults={filteredProducts.length}
        />

        {/* Categories Horizontal Filter */}
        <CategoryFilter
          categories={categories}
          activeCategoryId={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isLoading={loadingCategories}
          totalCount={products.length}
        />

        {/* Featured Offers Section (Only rendered when offers exist) */}
        <OffersSection
          offers={offers}
          isLoading={loadingOffers}
        />

        {/* All Products Section */}
        <section className="all-products-section" aria-label={t("allProducts")}>
          <div className="section-header-row">
            <h2 className="section-heading">{t("allProducts")}</h2>
            {!loadingProducts && !errorProducts && (
              <span className="results-count-text">
                {t("showingProductsCount")}{" "}
                <strong>{filteredProducts.length}</strong>{" "}
                {t("ofProductsCount")}{" "}
                <strong>{products.length}</strong>{" "}
                {t("itemCountLabel")}
              </span>
            )}
          </div>

          {/* Loading State: Skeletons */}
          {loadingProducts && <ProductSkeletonGrid count={8} />}

          {/* Error State */}
          {!loadingProducts && errorProducts && (
            <div className="products-error-state" role="alert">
              <div className="state-icon-wrap">
                <FiAlertCircle />
              </div>
              <h3 className="state-title">{errorProducts}</h3>
              <p className="state-desc">
                {isRTL
                  ? "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
                  : "Please check your network connection and try again."}
              </p>
              <button
                type="button"
                className="state-retry-btn"
                onClick={fetchProductsList}
              >
                <FiRefreshCw />
                <span>{t("retry")}</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingProducts && !errorProducts && filteredProducts.length === 0 && (
            <div className="products-empty-state">
              <div className="state-icon-wrap">
                <FiPackage />
              </div>
              <h3 className="state-title">{t("noProducts")}</h3>
              <p className="state-desc">{t("noProductsDesc")}</p>
              {(selectedCategory !== "all" || searchQuery) && (
                <button
                  type="button"
                  className="state-retry-btn"
                  onClick={resetFilters}
                >
                  <span>{t("clearFilters")}</span>
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!loadingProducts && !errorProducts && filteredProducts.length > 0 && (
            <div className="vendo-products-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ProductsPage;
