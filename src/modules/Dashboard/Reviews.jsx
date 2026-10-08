import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiMessageSquare,
  FiEye,
  FiAlertCircle,
  FiLoader,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCalendar,
  FiCheckCircle,
  FiUser,
  FiPackage,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getDashboardReviews,
  getDashboardReviewById,
  updateDashboardReviewStatus,
} from "@/services/reviewService";
import { FALLBACK_PRODUCT_IMAGE } from "@/modules/Products/utils/productHelpers";
import "./Reviews.css";

/**
 * DashboardReviews Component
 * Professional Reviews Management Page in the Vendo Admin Dashboard.
 *
 * Architecture & Tech Compliance:
 * - React + Vite (JavaScript / JSX only, NO TypeScript)
 * - Protected under existing Admin role guard in Router.jsx
 * - Axios Bearer token via existing sessionStorage interceptor
 * - Endpoint: GET /dashboard/all/reviews?page={page}
 * - Connects: Customer -> Rating -> Product -> Comment -> Status & Actions
 * - RTL/LTR via LanguageContext (useTranslation)
 * - Server-side pagination with responsive controls
 * - Skeleton loaders for card layout (no blank screens)
 * - Quick View Modal for full review details
 */
export function DashboardReviews() {
  const { t, isRTL, language } = useTranslation();

  // Reviews state & server-side pagination
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Status toggle state
  const [updatingReviewId, setUpdatingReviewId] = useState(null);

  // Quick View Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Helper: Format user initials fallback
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper: Format date according to project standard
  // Example: 7 أكتوبر 2026 (Arabic) or Oct 7, 2026 (English)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper: Format date with time for modal details
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dateFormatted = d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timeFormatted = d.toLocaleTimeString(isRTL ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateFormatted} - ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  };

  // Helper: Render Star Rating (1-5 stars)
  const renderStars = (rating) => {
    const numericRating = Number(rating);
    const valid = !isNaN(numericRating) && rating !== null && rating !== undefined;
    const clampedRating = valid ? Math.max(0, Math.min(5, Math.round(numericRating))) : 0;
    const scoreText = valid ? Number(numericRating).toFixed(1) : "0.0";

    return (
      <div
        className="review-stars-badge"
        role="img"
        aria-label={`${clampedRating} ${isRTL ? "نجوم من 5" : "stars out of 5"}`}
      >
        <div className="stars-icons-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="star-icon-wrap">
              {star <= clampedRating ? (
                <FaStar className="dash-star-icon filled" />
              ) : (
                <FaRegStar className="dash-star-icon empty" />
              )}
            </span>
          ))}
        </div>
        <span className="stars-score-text">{scoreText}</span>
      </div>
    );
  };

  // Helper: Get localized product title (strictly one language at a time)
  const getProductTitle = (product) => {
    if (!product) return isRTL ? "منتج غير معروف" : "Unknown Product";
    if (isRTL || language === "ar") {
      return product.name_ar || product.name_en || (isRTL ? "منتج بدون اسم" : "Unnamed Product");
    }
    return product.name_en || product.name_ar || (isRTL ? "منتج بدون اسم" : "Unnamed Product");
  };

  // Helper: Get product image with fallback
  const getProductImage = (product) => {
    if (!product) return FALLBACK_PRODUCT_IMAGE;
    return product.image || product.product_image || FALLBACK_PRODUCT_IMAGE;
  };

  // Fetch reviews list with server-side pagination
  const fetchReviews = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");
        const response = await getDashboardReviews(page);

        if (response && response.data) {
          setReviews(Array.isArray(response.data) ? response.data : []);
          if (response.pagination) {
            setPagination(response.pagination);
            setCurrentPage(response.pagination.current_page || page);
          }
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Fetch reviews error:", err);
        setError(
          err.response?.data?.message ||
          t("failedToLoadReviews") ||
          (isRTL ? "تعذر تحميل التقييمات، يرجى المحاولة مرة أخرى." : "Failed to load reviews. Please try again.")
        );
      } finally {
        setLoading(false);
      }
    },
    [t, isRTL]
  );

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;

    getDashboardReviews(1)
      .then((response) => {
        if (!isMounted) return;
        if (response && response.data) {
          setReviews(Array.isArray(response.data) ? response.data : []);
          if (response.pagination) {
            setPagination(response.pagination);
            setCurrentPage(response.pagination.current_page || 1);
          }
        } else {
          setReviews([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Fetch reviews error on mount:", err);
        setError(
          err.response?.data?.message ||
          t("failedToLoadReviews") ||
          (isRTL ? "تعذر تحميل التقييمات، يرجى المحاولة مرة أخرى." : "Failed to load reviews. Please try again.")
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [t, isRTL]);

  // Pagination page change
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.last_page &&
      newPage !== currentPage &&
      !loading
    ) {
      fetchReviews(newPage);
    }
  };

  // Status toggle handler
  const handleToggleStatus = async (review) => {
    if (updatingReviewId === review.id) return;

    const newStatus = !review.status;
    setUpdatingReviewId(review.id);

    try {
      await updateDashboardReviewStatus(review.id, newStatus);

      // Local optimistic update
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
      );

      // Keep modal in sync if open
      setSelectedReview((prev) =>
        prev && prev.id === review.id ? { ...prev, status: newStatus } : prev
      );

      toast.success(
        t("statusUpdatedSuccess") ||
        (isRTL ? "تم تحديث حالة التقييم بنجاح." : "Review status updated successfully.")
      );
    } catch (err) {
      console.error("Status update error:", err);
      const errMsg =
        err.response?.data?.message ||
        t("failedToUpdateStatus") ||
        (isRTL ? "تعذر تحديث حالة التقييم" : "Failed to update review status");
      toast.error(errMsg);
    } finally {
      setUpdatingReviewId(null);
    }
  };

  // Open Quick View Modal (fetches GET /dashboard/show/reviews/{id} only when opened)
  const handleOpenModal = async (id) => {
    setIsModalOpen(true);
    setLoadingModal(true);
    setSelectedReview(null);

    try {
      const response = await getDashboardReviewById(id);
      const reviewData = response?.data || response;
      setSelectedReview(reviewData);
    } catch (err) {
      console.error("Error fetching review details:", err);
      toast.error(
        err.response?.data?.message ||
        t("failedToLoadReview") ||
        (isRTL ? "تعذر تحميل تفاصيل التقييم" : "Failed to load review details")
      );
      setIsModalOpen(false);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  return (
    <div className="reviews-container" aria-label="Reviews Management Page">
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      {/* 1. Page Header Bar */}
      <header className="reviews-top-header">
        <div className="reviews-header-info">
          <h1>{t("reviewsTitle") || (isRTL ? "التقييمات" : "Reviews")}</h1>
          <p>
            {t("reviewsSubtitle") ||
              (isRTL
                ? "إدارة ومتابعة تقييمات العملاء وآرائهم حول المنتجات."
                : "Manage and monitor customer reviews and product feedback.")}
          </p>
        </div>

        <div className="reviews-header-aside">
          {/* Total Reviews Counter Badge */}
          <div className="reviews-summary-badge" aria-label="Total Reviews Counter">
            <span className="summary-badge-label">
              {t("totalReviewsCount") || (isRTL ? "إجمالي التقييمات" : "Total Reviews")}
            </span>
            <strong className="summary-badge-val">{pagination.total}</strong>
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            className="btn-retry-fetch"
            onClick={() => fetchReviews(currentPage)}
            title={t("retry") || (isRTL ? "تحديث" : "Refresh")}
            disabled={loading}
            aria-label={isRTL ? "تحديث القائمة" : "Refresh reviews"}
          >
            <FiRefreshCw className={loading ? "spin-animation" : ""} />
            <span>{isRTL ? "تحديث" : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Reviews Content Area */}
      <div className="reviews-list-card">
        {/* Error State */}
        {!loading && error && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-red">
              <FiAlertCircle />
            </div>
            <h3 className="state-title">{error}</h3>
            <button
              type="button"
              className="btn-retry-fetch"
              onClick={() => fetchReviews(currentPage)}
            >
              <FiRefreshCw />
              <span>{isRTL ? "إعادة المحاولة" : "Retry"}</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="dash-reviews-list" aria-label="Loading reviews">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="dash-review-card skeleton-card">
                <div className="review-card-top-row">
                  <div className="customer-info-block">
                    <div className="skeleton-avatar shimmer" />
                    <div className="skeleton-customer-meta">
                      <div className="skeleton-line shimmer" style={{ width: "130px", height: "16px" }} />
                      <div className="skeleton-line shimmer" style={{ width: "180px", height: "13px", marginTop: "6px" }} />
                    </div>
                  </div>
                  <div className="skeleton-badge shimmer" />
                </div>

                <div className="skeleton-line shimmer" style={{ width: "120px", height: "20px", margin: "0.5rem 0" }} />

                <div className="skeleton-product-block shimmer" />

                <div className="skeleton-comment-block shimmer" />

                <div className="skeleton-action-row shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reviews.length === 0 && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-gray">
              <FiMessageSquare />
            </div>
            <h3 className="state-title">
              {isRTL ? "لا توجد تقييمات حتى الآن" : "No reviews found"}
            </h3>
            <p className="state-desc" style={{ color: "var(--vendo-gray-muted)", margin: "0.5rem 0 0" }}>
              {isRTL
                ? "لم يقم أي عميل بإضافة تقييم حتى الآن، ستظهر جميع التقييمات الجديدة هنا."
                : "No customer reviews have been submitted yet. New reviews will appear here."}
            </p>
          </div>
        )}

        {/* Reviews Cards List */}
        {!loading && !error && reviews.length > 0 && (
          <>
            <div className="dash-reviews-list" aria-label="Customer Reviews List">
              {reviews.map((rev) => {
                const reviewerName =
                  rev.user?.name || (isRTL ? "عميل" : "Customer");
                const productTitle = getProductTitle(rev.product);
                const prodImg = getProductImage(rev.product);
                const isUpdating = updatingReviewId === rev.id;
                const formattedDate = formatDate(rev.created_at);

                return (
                  <article key={rev.id} className="dash-review-card">
                    {/* Top Row: Customer Info + Status Pill */}
                    <div className="review-card-top-row">
                      <div className="customer-info-block">
                        {/* User Avatar */}
                        {rev.user?.image ? (
                          <img
                            src={rev.user.image}
                            alt={reviewerName}
                            className="customer-avatar-img"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className="customer-avatar-placeholder"
                          style={{ display: rev.user?.image ? "none" : "flex" }}
                          aria-hidden="true"
                        >
                          {getInitials(reviewerName)}
                        </div>

                        {/* Customer Meta */}
                        <div className="customer-meta-text">
                          <span className="customer-name">{reviewerName}</span>
                          <span className="customer-sub-meta">
                            {rev.user?.id && (
                              <span>
                                {isRTL ? `مستخدم #${rev.user.id}` : `User #${rev.user.id}`}
                              </span>
                            )}
                            {rev.user?.id && formattedDate && <span> • </span>}
                            {formattedDate && (
                              <span className="review-date-text">
                                <FiCalendar className="date-icon-subtle" />
                                {formattedDate}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge & Toggle Button */}
                      <button
                        type="button"
                        className={`dash-status-pill ${rev.status ? "status-active" : "status-inactive"
                          }`}
                        onClick={() => handleToggleStatus(rev)}
                        disabled={isUpdating}
                        title={
                          rev.status
                            ? (isRTL ? "نشط - انقر للتعطيل" : "Active - Click to deactivate")
                            : (isRTL ? "غير نشط - انقر للتفعيل" : "Inactive - Click to activate")
                        }
                        aria-label={`${isRTL ? "الحالة" : "Status"}: ${rev.status ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")
                          }`}
                      >
                        {isUpdating ? (
                          <FiLoader className="spin-animation status-dot-icon" />
                        ) : (
                          <span
                            className={`status-dot ${rev.status ? "dot-active" : "dot-inactive"
                              }`}
                          />
                        )}
                        <span className="status-label">
                          {isUpdating
                            ? (isRTL ? "جاري التحديث..." : "Updating...")
                            : rev.status
                              ? (isRTL ? "نشط" : "Active")
                              : (isRTL ? "غير نشط" : "Inactive")}
                        </span>
                      </button>
                    </div>

                    {/* Rating Section */}
                    <div className="review-rating-row">
                      {renderStars(rev.rating)}
                    </div>

                    {/* Product Snippet Section */}
                    <div className="review-product-box">
                      <img
                        src={prodImg}
                        alt={productTitle}
                        className="review-product-img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />
                      <div className="review-product-meta">
                        <span className="product-tag-label">
                          <FiPackage className="product-tag-icon" />
                          <span>{isRTL ? "المنتج" : "Product"}</span>
                        </span>
                        <strong className="review-product-name" title={productTitle}>
                          {productTitle}
                        </strong>
                        {rev.product?.id && (
                          <span className="review-product-id">
                            #{rev.product.id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Comment Section */}
                    <div className="review-comment-box">
                      {rev.comment ? (
                        <blockquote className="review-comment-quote">
                          "{rev.comment}"
                        </blockquote>
                      ) : (
                        <span className="review-comment-empty">
                          {isRTL ? "لا يوجد تعليق مكتوب." : "No written comment."}
                        </span>
                      )}
                    </div>

                    {/* Card Actions Bottom Row */}
                    <div className="review-card-bottom-row">
                      <div className="card-id-stamp">
                        <span>#{rev.id}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-view-review-details"
                        onClick={() => handleOpenModal(rev.id)}
                        aria-label={`${isRTL ? "عرض تفاصيل التقييم" : "View Details"} #${rev.id}`}
                      >
                        <FiEye className="btn-icon" />
                        <span>{isRTL ? "عرض التفاصيل" : "View Details"}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Server-Side Pagination Bar */}
            {pagination.last_page > 1 && (
              <nav className="pagination-bar" aria-label="Reviews Pagination Navigation">
                <div className="pagination-info">
                  {`${isRTL ? "صفحة" : "Page"} ${currentPage} ${isRTL ? "من" : "of"
                    } ${pagination.last_page} (${isRTL ? "إجمالي التقييمات" : "Total Reviews"
                    }: ${pagination.total})`}
                </div>

                <div className="pagination-controls">
                  {/* Prev Button */}
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
                  >
                    {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
                    <span>{isRTL ? "السابق" : "Prev"}</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`btn-page-number ${pageNum === currentPage ? "active" : ""}`}
                      disabled={loading}
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={pageNum === currentPage ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPage >= pagination.last_page || loading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label={isRTL ? "الصفحة التالية" : "Next page"}
                  >
                    <span>{isRTL ? "التالي" : "Next"}</span>
                    {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {/* 3. Quick View Modal */}
      {isModalOpen && (
        <div
          className="vendo-modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vendo-modal-header">
              <h3 id="review-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-blue">
                  <FiMessageSquare />
                </div>
                <span>{t("reviewDetails") || (isRTL ? "تفاصيل التقييم" : "Review Details")}</span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseModal}
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <FiX />
              </button>
            </div>

            <div className="vendo-modal-body">
              {loadingModal ? (
                <div className="table-state-box" style={{ padding: "3rem 1.5rem" }}>
                  <div className="state-icon-box state-icon-blue">
                    <FiLoader className="spin-animation" />
                  </div>
                  <h4 className="state-title">
                    {isRTL ? "جاري تحميل تفاصيل التقييم..." : "Loading review details..."}
                  </h4>
                </div>
              ) : selectedReview ? (
                <div className="modal-review-content">
                  {/* Top Stats Strip */}
                  <div className="modal-stats-strip">
                    <div className="modal-id-badge">
                      <span className="badge-dim-label">
                        {isRTL ? "رقم التقييم" : "Review ID"}:
                      </span>{" "}
                      <strong>#{selectedReview.id}</strong>
                    </div>

                    <div>{renderStars(selectedReview.rating)}</div>
                  </div>

                  {/* Comment */}
                  <div className="modal-comment-section">
                    <label className="modal-section-label">
                      {isRTL ? "نص التعليق" : "Comment"}
                    </label>
                    <div className="modal-comment-quote">
                      {selectedReview.comment ? (
                        `"${selectedReview.comment}"`
                      ) : (
                        <span className="review-comment-empty">
                          {isRTL ? "لا يوجد تعليق مكتوب." : "No comment written."}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Product Information Cards */}
                  <div className="modal-two-col-grid">
                    {/* Customer */}
                    <div className="modal-info-panel">
                      <div className="panel-title-row">
                        <FiUser className="panel-icon" />
                        <span className="panel-title">{isRTL ? "بيانات العميل" : "Customer Info"}</span>
                      </div>
                      <div className="panel-body-content">
                        <div className="panel-user-row">
                          {selectedReview.user?.image ? (
                            <img
                              src={selectedReview.user.image}
                              alt={selectedReview.user.name || "User"}
                              className="panel-avatar"
                            />
                          ) : (
                            <div className="customer-avatar-placeholder">
                              {getInitials(selectedReview.user?.name)}
                            </div>
                          )}
                          <div>
                            <strong className="panel-name-text">
                              {selectedReview.user?.name || (isRTL ? "عميل غير معروف" : "Unknown Customer")}
                            </strong>
                            {selectedReview.user?.id && (
                              <div className="panel-sub-text">
                                {isRTL ? `معرف العميل: #${selectedReview.user.id}` : `User ID: #${selectedReview.user.id}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product */}
                    <div className="modal-info-panel">
                      <div className="panel-title-row">
                        <FiPackage className="panel-icon" />
                        <span className="panel-title">{isRTL ? "بيانات المنتج" : "Product Info"}</span>
                      </div>
                      <div className="panel-body-content">
                        <div className="panel-product-row">
                          <img
                            src={getProductImage(selectedReview.product)}
                            alt={getProductTitle(selectedReview.product)}
                            className="panel-product-thumb"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                          <div>
                            <strong className="panel-name-text">
                              {getProductTitle(selectedReview.product)}
                            </strong>
                            {selectedReview.product?.id && (
                              <div className="panel-sub-text">
                                {isRTL ? `معرف المنتج: #${selectedReview.product.id}` : `Product ID: #${selectedReview.product.id}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date & Status Meta */}
                  <div className="modal-meta-row">
                    <div className="modal-date-box">
                      <span className="badge-dim-label">
                        {isRTL ? "تاريخ الإنشاء" : "Created At"}:
                      </span>{" "}
                      <strong>{formatDateTime(selectedReview.created_at)}</strong>
                    </div>

                    <div className="modal-status-toggle">
                      <button
                        type="button"
                        className={`dash-status-pill ${selectedReview.status ? "status-active" : "status-inactive"
                          }`}
                        onClick={() => handleToggleStatus(selectedReview)}
                        disabled={updatingReviewId === selectedReview.id}
                      >
                        {updatingReviewId === selectedReview.id ? (
                          <FiLoader className="spin-animation status-dot-icon" />
                        ) : (
                          <FiCheckCircle size={13} />
                        )}
                        <span>
                          {updatingReviewId === selectedReview.id
                            ? (isRTL ? "جاري التحديث..." : "Updating...")
                            : selectedReview.status
                              ? (isRTL ? "نشط (تعطيل)" : "Active (Deactivate)")
                              : (isRTL ? "غير نشط (تفعيل)" : "Inactive (Activate)")}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="table-state-box">
                  <h4 className="state-title">{isRTL ? "التقييم غير موجود" : "Review not found"}</h4>
                </div>
              )}
            </div>

            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleCloseModal}
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardReviews;
