import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FaStar, FaRegStar } from "react-icons/fa";
import { FiMessageSquare, FiEdit3, FiSend, FiX, FiCalendar } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { createProductReview } from "@/services/reviewService";

/**
 * ProductReviews Component
 * Displays customer reviews, average score summary, and an interactive review submission form.
 *
 * Requirements satisfied:
 * - Bearer Token authentication via existing AuthContext + Axios interceptor.
 * - Dynamic product ID endpoint: POST /products/{productId}/reviews.
 * - Does NOT send user_id, product_id, or token in the request body.
 * - Rating strictly 1-5, accessible star rating component.
 * - Comment validation (required, trimmed, non-empty).
 * - Redirects unauthenticated users to existing Login page with location return state.
 * - Refreshes review list without reloading the browser.
 * - RTL/LTR support via useTranslation.
 * - Full responsive design across all viewports.
 *
 * @param {object} props
 * @param {number|string} props.productId - Current dynamic product ID
 * @param {Array} props.reviews - List of reviews from product details API
 * @param {object|null} props.ratingInfo - Rating summary { avgRating, count }
 * @param {Function} props.onReviewSubmitted - Callback to refresh product details after submission
 */
export function ProductReviews({
  productId,
  reviews = [],
  ratingInfo = null,
  onReviewSubmitted,
}) {
  const { isAuthenticated } = useAuth();
  const { t, language, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Form visibility state
  const [showForm, setShowForm] = useState(false);

  // Star rating states (1 to 5)
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      comment: "",
    },
  });

  // Accessible labels for stars
  const starLabels = {
    1: t("starRating_1") || (isRTL ? "نجمة واحدة" : "1 star"),
    2: t("starRating_2") || (isRTL ? "نجمتان" : "2 stars"),
    3: t("starRating_3") || (isRTL ? "3 نجوم" : "3 stars"),
    4: t("starRating_4") || (isRTL ? "4 نجوم" : "4 stars"),
    5: t("starRating_5") || (isRTL ? "5 نجوم" : "5 stars"),
  };

  // Format created date safely
  const formatReviewDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  /**
   * Handle user clicking "Add Your Review" / "أضف تقييمك"
   * If unauthenticated: redirect to login preserving current product location.
   * If authenticated: toggle the review form.
   */
  const handleToggleForm = () => {
    if (!isAuthenticated) {
      toast(
        t("pleaseLoginToReview") ||
          (isRTL ? "يرجى تسجيل الدخول أولاً لإضافة تقييم." : "Please log in to submit a review."),
        { icon: "🔒" }
      );
      navigate("/login", { state: { from: location } });
      return;
    }
    setShowForm((prev) => !prev);
  };

  /**
   * Form submission handler
   */
  const onSubmit = async (formData) => {
    // 1. Guard: Authentication check
    if (!isAuthenticated) {
      toast.error(
        t("pleaseLoginToReview") ||
          (isRTL ? "يرجى تسجيل الدخول أولاً لإضافة تقييم." : "Please log in to submit a review.")
      );
      navigate("/login", { state: { from: location } });
      return;
    }

    // 2. Validate rating strictly between 1 and 5
    const selectedRating = Number(rating);
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      toast.error(
        t("invalidRating") ||
          (isRTL ? "يرجى اختيار تقييم صحيح بين 1 و 5 نجوم." : "Please select a valid rating between 1 and 5 stars.")
      );
      return;
    }

    // 3. Validate comment: required, trimmed, non-empty
    const trimmedComment = formData.comment ? formData.comment.trim() : "";
    if (!trimmedComment) {
      toast.error(
        t("commentRequired") ||
          (isRTL ? "التعليق مطلوب ولا يمكن أن يكون فارغاً." : "Comment is required and cannot be empty.")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // POST /products/{productId}/reviews
      // Body strictly contains: rating (number) and comment (trimmed string)
      // Bearer token is automatically attached by Axios interceptor
      const responseData = await createProductReview(productId, {
        rating: selectedRating,
        comment: trimmedComment,
      });

      // Success feedback
      toast.success(
        t("reviewSubmittedSuccess") ||
          (isRTL ? "تم إرسال تقييمك بنجاح." : "Your review has been submitted successfully.")
      );

      // Reset form state
      reset({ comment: "" });
      setRating(5);
      setHoverRating(0);
      setShowForm(false);

      // Refresh reviews list via parent callback without page reload
      if (typeof onReviewSubmitted === "function") {
        await onReviewSubmitted(responseData);
      }
    } catch (error) {
      console.error("Submit review error:", error);

      if (error.response) {
        const status = error.response.status;
        const resData = error.response.data;

        if (status === 401) {
          toast.error(
            t("pleaseLoginToReview") ||
              (isRTL ? "يرجى تسجيل الدخول أولاً لإضافة تقييم." : "Please log in to submit a review.")
          );
          navigate("/login", { state: { from: location } });
          return;
        }

        if (status === 403) {
          toast.error(
            resData?.message ||
              (isRTL ? "غير مصرح لك بإضافة تقييم لهذا المنتج." : "You do not have permission to review this product.")
          );
          return;
        }

        if (status === 404) {
          toast.error(
            resData?.message ||
              (isRTL ? "المنتج غير موجود." : "Product not found.")
          );
          return;
        }

        if (status === 422) {
          if (resData?.errors) {
            const firstKey = Object.keys(resData.errors)[0];
            const messages = resData.errors[firstKey];
            const errText = Array.isArray(messages) ? messages[0] : messages;
            toast.error(errText || (isRTL ? "بيانات التقييم غير صحيحة." : "Invalid review data."));
          } else {
            toast.error(resData?.message || (isRTL ? "بيانات التقييم غير صحيحة." : "Invalid review data."));
          }
          return;
        }

        if (status >= 500) {
          toast.error(
            resData?.message ||
              (isRTL ? "حدث خطأ في الخادم، يرجى المحاولة لاحقاً." : "Server error. Please try again later.")
          );
          return;
        }

        toast.error(
          resData?.message ||
            t("failedToSubmitReview") ||
            (isRTL ? "تعذر إرسال التقييم." : "Failed to submit review.")
        );
      } else if (error.request) {
        toast.error(
          isRTL
            ? "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت."
            : "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        toast.error(
          error.message ||
            t("failedToSubmitReview") ||
            (isRTL ? "حدث خطأ غير متوقع." : "An unexpected error occurred.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDisplayRating = hoverRating || rating;

  return (
    <section className="details-reviews-section" aria-label={t("reviewsLabel") || "Customer Reviews"}>
      {/* 1. Header with Stats & Action */}
      <div className="reviews-section-header">
        <div className="reviews-header-info">
          <h2 className="reviews-title">{t("reviewsLabel") || "Customer Reviews"}</h2>
          {ratingInfo && (
            <div className="reviews-header-summary" aria-label={`Average rating: ${ratingInfo.avgRating} out of 5`}>
              <FaStar className="star-icon filled" />
              <strong>{ratingInfo.avgRating}</strong>
              <span>/ 5.0</span>
              <span className="reviews-count-badge">
                {reviews.length} {t("reviewsCount") || "reviews"}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-write-review"
          onClick={handleToggleForm}
          aria-expanded={showForm}
          aria-controls="product-review-form"
        >
          {showForm ? (
            <>
              <FiX className="btn-icon" />
              <span>{t("cancelReview") || (isRTL ? "إلغاء" : "Cancel")}</span>
            </>
          ) : (
            <>
              <FiEdit3 className="btn-icon" />
              <span>{t("addYourReview") || (isRTL ? "أضف تقييمك" : "Add Your Review")}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Review Form (Collapsible / Dynamic) */}
      {showForm && (
        <div id="product-review-form" className="review-form-card" role="region" aria-label={t("writeReview")}>
          <div className="review-form-header">
            <h3 className="review-form-title">
              <FiEdit3 className="form-title-icon" />
              <span>{t("writeReview") || (isRTL ? "كتابة تقييم" : "Write a Review")}</span>
            </h3>
            <button
              type="button"
              className="review-form-close-btn"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
              aria-label={t("cancelReview") || "Cancel"}
            >
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="review-form" noValidate>
            {/* Interactive Rating Star Picker */}
            <div className="review-field-group">
              <label className="review-field-label" id="rating-picker-label">
                <span>{t("yourRating") || (isRTL ? "تقييمك للمنتج" : "Your Rating")}</span>
                <span className="required-star">*</span>
                <span className="rating-active-text">({starLabels[activeDisplayRating]})</span>
              </label>

              <div
                className="interactive-stars-row"
                role="radiogroup"
                aria-labelledby="rating-picker-label"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeDisplayRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      role="radio"
                      aria-checked={rating === starVal}
                      aria-label={starLabels[starVal]}
                      title={starLabels[starVal]}
                      disabled={isSubmitting}
                      className={`interactive-star-btn ${isFilled ? "active" : ""}`}
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onFocus={() => setHoverRating(starVal)}
                      onBlur={() => setHoverRating(0)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setRating(starVal);
                        }
                      }}
                    >
                      {isFilled ? (
                        <FaStar className="star-icon filled" />
                      ) : (
                        <FaRegStar className="star-icon empty" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="review-field-group">
              <label className="review-field-label" htmlFor="review-comment-input">
                <span>{t("yourComment") || (isRTL ? "رأيك أو تجربتك مع المنتج" : "Your Comment")}</span>
                <span className="required-star">*</span>
              </label>

              <textarea
                id="review-comment-input"
                className={`review-textarea ${errors.comment ? "input-error" : ""}`}
                rows={4}
                placeholder={
                  t("commentPlaceholder") ||
                  (isRTL
                    ? "اكتب رأيك وتجربتك بالتفصيل لمساعدة الآخرين..."
                    : "Share your detailed experience to help others...")
                }
                disabled={isSubmitting}
                {...register("comment", {
                  required:
                    t("commentRequired") ||
                    (isRTL ? "التعليق مطلوب" : "Comment is required"),
                  validate: (val) => {
                    if (!val || !val.trim()) {
                      return (
                        t("commentRequired") ||
                        (isRTL
                          ? "يرجى كتابة تعليق غير فارغ"
                          : "Please enter a non-empty comment")
                      );
                    }
                    return true;
                  },
                })}
              />

              {errors.comment && (
                <span className="review-error-message" role="alert">
                  {errors.comment.message}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="review-form-actions">
              <button
                type="submit"
                className="btn-submit-review"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-inline" />
                    <span>
                      {t("submittingReview") ||
                        (isRTL ? "جاري إرسال التقييم..." : "Submitting...")}
                    </span>
                  </>
                ) : (
                  <>
                    <FiSend className="btn-icon" />
                    <span>
                      {t("submitReview") ||
                        (isRTL ? "إرسال التقييم" : "Submit Review")}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-cancel-review"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                {t("cancelReview") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Display Existing Reviews */}
      {reviews.length > 0 ? (
        <div className="reviews-cards-grid">
          {reviews.map((rev) => {
            const formattedDate = formatReviewDate(rev.created_at || rev.date);
            const userInitial = (rev.user?.name || "U").charAt(0).toUpperCase();

            return (
              <article key={rev.id} className="review-card">
                <div className="review-card-header">
                  {/* User Avatar */}
                  {rev.user?.image ? (
                    <img
                      src={rev.user.image}
                      alt={rev.user.name || "User"}
                      className="review-user-avatar"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="review-avatar-fallback" aria-hidden="true">
                      {userInitial}
                    </div>
                  )}

                  <div className="review-user-meta">
                    <span className="review-user-name">
                      {rev.user?.name || (isRTL ? "عميل" : "Customer")}
                    </span>

                    {/* Review Star Rating */}
                    <div
                      className="review-stars-row"
                      aria-label={`${rev.rating} ${isRTL ? "نجوم من 5" : "stars out of 5"}`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {star <= Number(rev.rating) ? (
                            <FaStar className="star-icon filled" />
                          ) : (
                            <FaRegStar className="star-icon empty" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Formatted Date if available */}
                  {formattedDate && (
                    <div className="review-card-date">
                      <FiCalendar className="date-icon" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                </div>

                {/* Review Comment */}
                {rev.comment && (
                  <p className="review-comment-body">{rev.comment}</p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="reviews-empty-box">
          <div className="reviews-empty-icon">
            <FiMessageSquare />
          </div>
          <h3 className="reviews-empty-title">
            {t("noReviewsYet") || (isRTL ? "لا توجد تقييمات بعد" : "No reviews yet")}
          </h3>
          <p className="reviews-empty-desc">
            {t("noReviewsDesc") ||
              (isRTL
                ? "كن أول من يشارك تجربته مع هذا المنتج ويساعد المتسوقين الآخرين."
                : "Be the first to share your experience with this product and help other shoppers.")}
          </p>
          {!showForm && (
            <button
              type="button"
              className="btn-write-review empty-cta"
              onClick={handleToggleForm}
            >
              <FiEdit3 className="btn-icon" />
              <span>{t("addYourReview") || (isRTL ? "أضف تقييمك" : "Add Your Review")}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default ProductReviews;
