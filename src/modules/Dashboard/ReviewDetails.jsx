import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiArrowRight,
  FiArrowLeft,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiLoader,
  FiCheckCircle,
  FiX,
  FiUser,
  FiPackage,
  FiExternalLink,
  FiMessageSquare,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getDashboardReviewById,
  updateDashboardReviewStatus,
} from "@/services/reviewService";
import { FALLBACK_PRODUCT_IMAGE } from "@/modules/Products/utils/productHelpers";
import "./Reviews.css";

/**
 * DashboardReviewDetails Component
 * Dedicated Review Details Page for Vendo Admin Dashboard.
 *
 * Requirements:
 * - Route: /dashboard/reviews/:id
 * - API: GET /dashboard/show/reviews/{id}
 * - Status API: POST /dashboard/update/reviews/{id}/status
 * - Structured display: Customer, Product, Rating (1-5 stars), Comment, Date, Status
 * - Confirmation dialog before activating/deactivating review
 * - Loading skeletons, 404 handling, error handling with retry
 * - RTL/LTR support, responsive on mobile/tablet/desktop
 */
export function DashboardReviewDetails() {
  const { id } = useParams();
  const { t, isRTL, language } = useTranslation();

  // Review data state
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  // Status toggle state & confirmation modal
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null); // boolean or null

  // Format initials for customer avatar fallback
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Format date according to project standard
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format localized product title (strictly one language)
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

  // Render 5 stars rating
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
        <span className="stars-score-text">{scoreText} / 5</span>
      </div>
    );
  };

  // Fetch single review details by ID
  const fetchReviewDetails = async () => {
    setLoading(true);
    setError("");
    setIsNotFound(false);

    try {
      const response = await getDashboardReviewById(id);
      if (response && response.data) {
        setReview(response.data);
      } else if (response && response.id) {
        setReview(response);
      } else {
        setIsNotFound(true);
      }
    } catch (err) {
      console.error("Error fetching review details:", err);
      if (err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setError(
          err.response?.data?.message ||
            t("failedToLoadReview") ||
            (isRTL ? "تعذر تحميل تفاصيل التقييم." : "Failed to load review details.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Request status toggle (opens confirmation modal)
  const handleRequestStatusChange = (newStatus) => {
    setStatusConfirmTarget(newStatus);
  };

  // Execute confirmed status change
  const handleConfirmStatusChange = async () => {
    if (statusConfirmTarget === null || isUpdatingStatus) return;

    const newStatus = statusConfirmTarget;
    setIsUpdatingStatus(true);

    try {
      await updateDashboardReviewStatus(id, newStatus);

      // Optimistic update of local review state
      setReview((prev) => (prev ? { ...prev, status: newStatus } : prev));

      toast.success(
        t("statusUpdatedSuccess") ||
          (isRTL ? "تم تحديث حالة التقييم بنجاح." : "Review status updated successfully.")
      );
      setStatusConfirmTarget(null);
    } catch (err) {
      console.error("Error updating review status:", err);
      const errMsg =
        err.response?.data?.message ||
        t("failedToUpdateStatus") ||
        (isRTL ? "تعذر تحديث حالة التقييم." : "Failed to update review status.");
      toast.error(errMsg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ----------------------------------------------------
  // SKELETON LOADING STATE
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="review-details-container" aria-label="Loading Review Details">
        {/* Breadcrumb Skeleton */}
        <div className="skeleton-line shimmer" style={{ width: "160px", height: "20px", marginBottom: "1.5rem" }} />

        {/* Header Skeleton */}
        <div className="details-header-card skeleton-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="skeleton-line shimmer" style={{ width: "220px", height: "28px" }} />
              <div className="skeleton-line shimmer" style={{ width: "140px", height: "16px", marginTop: "8px" }} />
            </div>
            <div className="skeleton-badge shimmer" style={{ width: "120px", height: "38px" }} />
          </div>
        </div>

        {/* Body Skeletons */}
        <div className="details-main-grid">
          <div className="details-info-panel skeleton-card">
            <div className="skeleton-line shimmer" style={{ width: "180px", height: "22px", marginBottom: "1rem" }} />
            <div className="skeleton-line shimmer" style={{ width: "100%", height: "80px" }} />
          </div>

          <div className="details-side-grid">
            <div className="details-info-panel skeleton-card">
              <div className="skeleton-line shimmer" style={{ width: "140px", height: "20px", marginBottom: "1rem" }} />
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div className="skeleton-avatar shimmer" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line shimmer" style={{ width: "120px", height: "16px" }} />
                  <div className="skeleton-line shimmer" style={{ width: "80px", height: "12px", marginTop: "6px" }} />
                </div>
              </div>
            </div>

            <div className="details-info-panel skeleton-card">
              <div className="skeleton-line shimmer" style={{ width: "140px", height: "20px", marginBottom: "1rem" }} />
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div className="skeleton-line shimmer" style={{ width: "52px", height: "52px", borderRadius: "8px" }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line shimmer" style={{ width: "140px", height: "16px" }} />
                  <div className="skeleton-line shimmer" style={{ width: "90px", height: "12px", marginTop: "6px" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 404 NOT FOUND OR ERROR STATE
  // ----------------------------------------------------
  if (isNotFound || error || !review) {
    return (
      <div className="review-details-container">
        <Toaster position={isRTL ? "top-left" : "top-right"} />

        {/* Back Link */}
        <div className="details-breadcrumb">
          <Link to="/dashboard/reviews" className="btn-back-link">
            {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
            <span>{t("backToReviews") || (isRTL ? "العودة إلى التقييمات" : "Back to Reviews")}</span>
          </Link>
        </div>

        <div className="table-state-box" style={{ margin: "2rem auto", maxWidth: "560px" }}>
          <div className="state-icon-box state-icon-red">
            <FiAlertCircle />
          </div>
          <h2 className="state-title">
            {isNotFound
              ? t("reviewNotFound") || (isRTL ? "التقييم غير موجود" : "Review not found")
              : error}
          </h2>
          <p className="state-desc">
            {isNotFound
              ? t("reviewNotFoundDesc") || (isRTL ? "قد يكون تم حذف التقييم أو أن الرابط غير صحيح." : "The review may have been deleted or the link is invalid.")
              : t("failedToLoadReview") || (isRTL ? "تعذر تحميل بيانات التقييم، يرجى المحاولة مرة أخرى." : "Failed to load review data. Please try again.")}
          </p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/dashboard/reviews" className="btn-primary-action">
              <span>{t("backToReviews") || (isRTL ? "العودة إلى التقييمات" : "Back to Reviews")}</span>
            </Link>

            {!isNotFound && (
              <button
                type="button"
                className="btn-retry-fetch"
                onClick={fetchReviewDetails}
              >
                <FiRefreshCw />
                <span>{isRTL ? "إعادة المحاولة" : "Retry"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Computed values
  const reviewerName = review.user?.name || (isRTL ? "عميل" : "Customer");
  const productTitle = getProductTitle(review.product);
  const prodImg = getProductImage(review.product);
  const formattedDate = formatDate(review.created_at);

  return (
    <div className="review-details-container" aria-label="Review Details Page">
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      {/* 1. Breadcrumb Navigation */}
      <nav className="details-breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard/reviews" className="btn-back-link">
          {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
          <span>{t("backToReviews") || (isRTL ? "العودة إلى التقييمات" : "Back to Reviews")}</span>
        </Link>
      </nav>

      {/* 2. Top Header Card */}
      <header className="details-header-card">
        <div className="details-header-main">
          <div className="details-title-wrap">
            <h1 className="details-page-title">
              {t("reviewDetails") || (isRTL ? "تفاصيل التقييم" : "Review Details")}{" "}
              <span className="details-id-tag">#{review.id}</span>
            </h1>
            <div className="details-subtitle-meta">
              <span className="details-date-item">
                <FiCalendar className="date-icon-subtle" />
                <span>{formattedDate}</span>
              </span>
            </div>
          </div>

          {/* Status Badge & Status Toggle Control */}
          <div className="details-status-control-wrap">
            <span
              className={`dash-status-pill ${
                review.status ? "status-active" : "status-inactive"
              }`}
            >
              <span
                className={`status-dot ${
                  review.status ? "dot-active" : "dot-inactive"
                }`}
              />
              <span className="status-label">
                {review.status
                  ? t("active") || (isRTL ? "نشط" : "Active")
                  : t("inactive") || (isRTL ? "غير نشط" : "Inactive")}
              </span>
            </span>

            <button
              type="button"
              className={`btn-toggle-status-action ${
                review.status ? "btn-deactivate" : "btn-activate"
              }`}
              onClick={() => handleRequestStatusChange(!review.status)}
              disabled={isUpdatingStatus}
              aria-label={
                review.status
                  ? isRTL ? "تعطيل التقييم" : "Deactivate Review"
                  : isRTL ? "تفعيل التقييم" : "Activate Review"
              }
            >
              {review.status ? (
                <>
                  <FiX />
                  <span>{isRTL ? "تعطيل التقييم" : "Deactivate Review"}</span>
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  <span>{isRTL ? "تفعيل التقييم" : "Activate Review"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Details Two-Column Layout */}
      <div className="details-main-grid">
        {/* Main Column: Review Information */}
        <section className="details-info-panel" aria-label="Review Information">
          <div className="panel-header-bar">
            <div className="panel-title-group">
              <FiMessageSquare className="panel-title-icon" />
              <h2 className="panel-heading">
                {t("reviewInformation") || (isRTL ? "معلومات التقييم" : "Review Information")}
              </h2>
            </div>
            {renderStars(review.rating)}
          </div>

          <div className="panel-body-block">
            {/* Review Comment Quote */}
            <div className="review-comment-full-box">
              <span className="comment-label-hint">
                {t("comment") || (isRTL ? "التعليق" : "Comment")}:
              </span>
              {review.comment ? (
                <blockquote className="review-comment-large-quote">
                  "{review.comment}"
                </blockquote>
              ) : (
                <p className="review-comment-empty">
                  {t("noComment") || (isRTL ? "لا يوجد تعليق مكتوب." : "No written comment.")}
                </p>
              )}
            </div>

            {/* Quick Metadata Grid */}
            <div className="review-meta-props-grid">
              <div className="meta-prop-item">
                <span className="prop-label">{t("reviewId") || (isRTL ? "معرف التقييم" : "Review ID")}</span>
                <strong className="prop-value">#{review.id}</strong>
              </div>

              <div className="meta-prop-item">
                <span className="prop-label">{t("rating") || (isRTL ? "التقييم" : "Rating")}</span>
                <strong className="prop-value">{review.rating} / 5</strong>
              </div>

              <div className="meta-prop-item">
                <span className="prop-label">{t("status") || (isRTL ? "الحالة" : "Status")}</span>
                <strong className="prop-value" style={{ color: review.status ? "#047857" : "#64748b" }}>
                  {review.status
                    ? t("active") || (isRTL ? "نشط" : "Active")
                    : t("inactive") || (isRTL ? "غير نشط" : "Inactive")}
                </strong>
              </div>

              <div className="meta-prop-item">
                <span className="prop-label">{isRTL ? "تاريخ الإنشاء" : "Created Date"}</span>
                <strong className="prop-value">{formattedDate}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Side Column: Customer and Product Cards */}
        <div className="details-side-grid">
          {/* Customer Card */}
          <section className="details-info-panel" aria-label="Customer Information">
            <div className="panel-header-bar">
              <div className="panel-title-group">
                <FiUser className="panel-title-icon" />
                <h2 className="panel-heading">
                  {t("customerInformation") || (isRTL ? "بيانات العميل" : "Customer Information")}
                </h2>
              </div>
            </div>

            <div className="panel-body-block">
              <div className="customer-card-profile">
                {review.user?.image ? (
                  <img
                    src={review.user.image}
                    alt={reviewerName}
                    className="customer-avatar-large"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}

                <div
                  className="customer-avatar-large-placeholder"
                  style={{ display: review.user?.image ? "none" : "flex" }}
                  aria-hidden="true"
                >
                  {getInitials(reviewerName)}
                </div>

                <div className="customer-profile-meta">
                  <strong className="customer-name-large">{reviewerName}</strong>
                  {review.user?.id && (
                    <span className="customer-id-pill">
                      {isRTL ? `معرف العميل: #${review.user.id}` : `User ID: #${review.user.id}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Product Card */}
          <section className="details-info-panel" aria-label="Product Information">
            <div className="panel-header-bar">
              <div className="panel-title-group">
                <FiPackage className="panel-title-icon" />
                <h2 className="panel-heading">
                  {t("productInformation") || (isRTL ? "بيانات المنتج" : "Product Information")}
                </h2>
              </div>
              {review.product?.id && (
                <Link
                  to={`/products/${review.product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-storefront-link"
                  title={isRTL ? "عرض المنتج في المتجر" : "View in Storefront"}
                >
                  <FiExternalLink />
                  <span>{isRTL ? "المتجر" : "Storefront"}</span>
                </Link>
              )}
            </div>

            <div className="panel-body-block">
              <div className="product-card-profile">
                <img
                  src={prodImg}
                  alt={productTitle}
                  className="product-thumb-large"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                  }}
                />

                <div className="product-profile-meta">
                  <strong className="product-title-large" title={productTitle}>
                    {productTitle}
                  </strong>
                  {review.product?.id && (
                    <span className="product-id-pill">
                      {isRTL ? `معرف المنتج: #${review.product.id}` : `Product ID: #${review.product.id}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 4. Confirmation Dialog Modal (Activate / Deactivate) */}
      {statusConfirmTarget !== null && (
        <div
          className="vendo-modal-backdrop"
          onClick={() => !isUpdatingStatus && setStatusConfirmTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-status-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vendo-modal-header">
              <h3 id="confirm-status-modal-title" className="vendo-modal-title">
                <div
                  className={`modal-header-icon ${
                    statusConfirmTarget ? "modal-icon-blue" : "modal-icon-red"
                  }`}
                >
                  {statusConfirmTarget ? <FiCheckCircle /> : <FiAlertCircle />}
                </div>
                <span>
                  {statusConfirmTarget
                    ? t("confirmActivateReviewTitle") || (isRTL ? "تأكيد تفعيل التقييم" : "Confirm Review Activation")
                    : t("confirmDeactivateReviewTitle") || (isRTL ? "تأكيد تعطيل التقييم" : "Confirm Review Deactivation")}
                </span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !isUpdatingStatus && setStatusConfirmTarget(null)}
                disabled={isUpdatingStatus}
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <FiX />
              </button>
            </div>

            <div className="vendo-modal-body" style={{ textAlign: "center", padding: "1.75rem 1.5rem" }}>
              <p style={{ fontSize: "1rem", color: "var(--vendo-dark)", lineHeight: 1.6, margin: 0 }}>
                {statusConfirmTarget
                  ? t("confirmActivateReviewMessage") ||
                    (isRTL
                      ? "هل أنت متأكد من تفعيل هذا التقييم؟ سيظهر التقييم للمستخدمين في المتجر."
                      : "Are you sure you want to activate this review? It will become visible to customers on the storefront.")
                  : t("confirmDeactivateReviewMessage") ||
                    (isRTL
                      ? "هل أنت متأكد من تعطيل هذا التقييم؟ سيتم إخفاء هذا التقييم من المتجر."
                      : "Are you sure you want to deactivate this review? It will be hidden from the storefront.")}
              </p>
            </div>

            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setStatusConfirmTarget(null)}
                disabled={isUpdatingStatus}
              >
                {t("cancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>

              <button
                type="button"
                className={`btn-confirm-status ${
                  statusConfirmTarget ? "btn-confirm-blue" : "btn-confirm-red"
                }`}
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <>
                    <FiLoader className="spin-animation" />
                    <span>{t("updatingStatus") || (isRTL ? "جاري التحديث..." : "Updating...")}</span>
                  </>
                ) : (
                  <span>
                    {statusConfirmTarget
                      ? isRTL ? "تأكيد التفعيل" : "Confirm Activation"
                      : isRTL ? "تأكيد التعطيل" : "Confirm Deactivation"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardReviewDetails;
