import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FiSliders,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiLayers,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getColors,
  createColor,
  deleteColor,
  getSizes,
  createSize,
  deleteSize,
} from "@/services/attributeService";
import "./Categories.css";
import "./ColorsSizes.css";

// Helper: Format date for table display
const formatDate = (dateStr, isRTL) => {
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

export function DashboardColorsSizes() {
  const { t, isRTL } = useTranslation();

  // ====================================================
  // COLORS STATE
  // ====================================================
  const [colors, setColors] = useState([]);
  const [colorsPagination, setColorsPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [colorsPage, setColorsPage] = useState(1);
  const [loadingColors, setLoadingColors] = useState(true);
  const [colorsError, setColorsError] = useState("");
  const [colorsRefreshTrigger, setColorsRefreshTrigger] = useState(0);

  // Create Color Modal State
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [colorForm, setColorForm] = useState({ name_ar: "", name_en: "" });
  const [colorFormErrors, setColorFormErrors] = useState({});
  const [isSubmittingColor, setIsSubmittingColor] = useState(false);

  // Delete Color Modal State
  const [colorToDelete, setColorToDelete] = useState(null);
  const [isDeletingColor, setIsDeletingColor] = useState(false);

  // ====================================================
  // SIZES STATE
  // ====================================================
  const [sizes, setSizes] = useState([]);
  const [sizesPagination, setSizesPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [sizesPage, setSizesPage] = useState(1);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [sizesError, setSizesError] = useState("");
  const [sizesRefreshTrigger, setSizesRefreshTrigger] = useState(0);

  // Create Size Modal State
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [sizeForm, setSizeForm] = useState({ name: "" });
  const [sizeFormErrors, setSizeFormErrors] = useState({});
  const [isSubmittingSize, setIsSubmittingSize] = useState(false);

  // Delete Size Modal State
  const [sizeToDelete, setSizeToDelete] = useState(null);
  const [isDeletingSize, setIsDeletingSize] = useState(false);

  // ====================================================
  // FETCH COLORS EFFECT
  // ====================================================
  useEffect(() => {
    let ignore = false;

    const loadColors = async () => {
      try {
        const response = await getColors(colorsPage);
        if (!ignore) {
          if (response && response.data) {
            setColors(Array.isArray(response.data) ? response.data : []);
            if (response.pagination) {
              setColorsPagination(response.pagination);
            }
          } else {
            setColors([]);
          }
          setColorsError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch colors error:", err);
          setColorsError(
            err.response?.data?.message ||
              t("errorLoadingColors") ||
              "تعذر تحميل الألوان، يرجى المحاولة مرة أخرى."
          );
        }
      } finally {
        if (!ignore) {
          setLoadingColors(false);
        }
      }
    };

    loadColors();

    return () => {
      ignore = true;
    };
  }, [colorsPage, colorsRefreshTrigger, t]);

  // ====================================================
  // FETCH SIZES EFFECT
  // ====================================================
  useEffect(() => {
    let ignore = false;

    const loadSizes = async () => {
      try {
        const response = await getSizes(sizesPage);
        if (!ignore) {
          if (response && response.data) {
            setSizes(Array.isArray(response.data) ? response.data : []);
            if (response.pagination) {
              setSizesPagination(response.pagination);
            }
          } else {
            setSizes([]);
          }
          setSizesError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch sizes error:", err);
          setSizesError(
            err.response?.data?.message ||
              t("errorLoadingSizes") ||
              "تعذر تحميل المقاسات، يرجى المحاولة مرة أخرى."
          );
        }
      } finally {
        if (!ignore) {
          setLoadingSizes(false);
        }
      }
    };

    loadSizes();

    return () => {
      ignore = true;
    };
  }, [sizesPage, sizesRefreshTrigger, t]);

  // ====================================================
  // COLOR HANDLERS
  // ====================================================
  const handleOpenColorModal = () => {
    setColorForm({ name_ar: "", name_en: "" });
    setColorFormErrors({});
    setIsColorModalOpen(true);
  };

  const handleCloseColorModal = () => {
    if (!isSubmittingColor) {
      setIsColorModalOpen(false);
    }
  };

  const handleCreateColorSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const trimmedAr = colorForm.name_ar.trim();
    const trimmedEn = colorForm.name_en.trim();

    if (!trimmedAr) {
      errors.name_ar = t("requiredField") || "هذا الحقل مطلوب";
    }
    if (!trimmedEn) {
      errors.name_en = t("requiredField") || "هذا الحقل مطلوب";
    }

    if (Object.keys(errors).length > 0) {
      setColorFormErrors(errors);
      return;
    }

    try {
      setIsSubmittingColor(true);
      await createColor({ name_ar: trimmedAr, name_en: trimmedEn });
      toast.success(t("colorCreatedSuccess") || "تم إضافة اللون بنجاح");
      setIsColorModalOpen(false);
      setLoadingColors(true);
      setColorsRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Create color error:", err);
      const msg = err.response?.data?.message || (isRTL ? "تعذر إضافة اللون" : "Failed to create color");
      toast.error(msg);
    } finally {
      setIsSubmittingColor(false);
    }
  };

  const handleDeleteColorConfirm = async () => {
    if (!colorToDelete) return;
    try {
      setIsDeletingColor(true);
      await deleteColor(colorToDelete.id);
      toast.success(t("colorDeletedSuccess") || "تم حذف اللون بنجاح");

      // Handle page edge case: if only 1 item was on current page and page > 1, go back
      if (colors.length === 1 && colorsPage > 1) {
        setColorsPage((prev) => prev - 1);
      } else {
        setColorsRefreshTrigger((prev) => prev + 1);
      }
      setColorToDelete(null);
    } catch (err) {
      console.error("Delete color error:", err);
      const msg = err.response?.data?.message || (isRTL ? "تعذر حذف اللون" : "Failed to delete color");
      toast.error(msg);
    } finally {
      setIsDeletingColor(false);
    }
  };

  // ====================================================
  // SIZE HANDLERS
  // ====================================================
  const handleOpenSizeModal = () => {
    setSizeForm({ name: "" });
    setSizeFormErrors({});
    setIsSizeModalOpen(true);
  };

  const handleCloseSizeModal = () => {
    if (!isSubmittingSize) {
      setIsSizeModalOpen(false);
    }
  };

  const handleCreateSizeSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const trimmedName = sizeForm.name.trim();

    if (!trimmedName) {
      errors.name = t("requiredField") || "هذا الحقل مطلوب";
    }

    if (Object.keys(errors).length > 0) {
      setSizeFormErrors(errors);
      return;
    }

    try {
      setIsSubmittingSize(true);
      await createSize({ name: trimmedName });
      toast.success(t("sizeCreatedSuccess") || "تم إضافة المقاس بنجاح");
      setIsSizeModalOpen(false);
      setLoadingSizes(true);
      setSizesRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Create size error:", err);
      const msg = err.response?.data?.message || (isRTL ? "تعذر إضافة المقاس" : "Failed to create size");
      toast.error(msg);
    } finally {
      setIsSubmittingSize(false);
    }
  };

  const handleDeleteSizeConfirm = async () => {
    if (!sizeToDelete) return;
    try {
      setIsDeletingSize(true);
      await deleteSize(sizeToDelete.id);
      toast.success(t("sizeDeletedSuccess") || "تم حذف المقاس بنجاح");

      // Handle page edge case: if only 1 item was on current page and page > 1, go back
      if (sizes.length === 1 && sizesPage > 1) {
        setSizesPage((prev) => prev - 1);
      } else {
        setSizesRefreshTrigger((prev) => prev + 1);
      }
      setSizeToDelete(null);
    } catch (err) {
      console.error("Delete size error:", err);
      const msg = err.response?.data?.message || (isRTL ? "تعذر حذف المقاس" : "Failed to delete size");
      toast.error(msg);
    } finally {
      setIsDeletingSize(false);
    }
  };

  return (
    <div className="options-dashboard-view">
      {/* Page Header */}
      <div className="options-page-header">
        <div className="options-header-info">
          <div className="options-header-icon" aria-hidden="true">
            <FiSliders />
          </div>
          <div>
            <h1 className="options-header-title">
              {t("productOptionsTitle") || (isRTL ? "خيارات المنتجات" : "Product Options")}
            </h1>
            <p className="options-header-subtitle">
              {t("productOptionsSubtitle") ||
                (isRTL
                  ? "إدارة الألوان والمقاسات المستخدمة في خيارات المنتجات."
                  : "Manage colors and sizes used by product variants.")}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Sections Grid */}
      <div className="options-sections-grid">
        {/* ====================================================
            COLUMN 1: COLORS MANAGEMENT
            ==================================================== */}
        <div className="option-panel-card">
          <div className="option-panel-header">
            <div className="option-panel-title-wrap">
              <h2 className="option-panel-title">
                {t("colorsSectionTitle") || (isRTL ? "الألوان" : "Colors")}
              </h2>
              <span className="option-count-badge">
                {colorsPagination.total} {isRTL ? "لون" : "colors"}
              </span>
            </div>

            <button
              type="button"
              className="btn-add-option"
              onClick={handleOpenColorModal}
              id="btn-add-color"
            >
              <FiPlus aria-hidden="true" />
              <span>{t("addColor") || (isRTL ? "إضافة لون" : "Add Color")}</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {loadingColors && (
            <div style={{ padding: "1.5rem" }}>
              <div className="skeleton-row" style={{ height: "40px" }} />
              <div className="skeleton-row" style={{ height: "45px" }} />
              <div className="skeleton-row" style={{ height: "45px" }} />
              <div className="skeleton-row" style={{ height: "45px" }} />
            </div>
          )}

          {/* Error State */}
          {!loadingColors && colorsError && (
            <div className="option-panel-error">
              <div className="option-error-icon" aria-hidden="true">
                <FiAlertCircle />
              </div>
              <p className="option-error-text">{colorsError}</p>
              <button
                type="button"
                className="btn-orders-refresh"
                onClick={() => {
                  setLoadingColors(true);
                  setColorsRefreshTrigger((prev) => prev + 1);
                }}
              >
                <FiRefreshCw aria-hidden="true" />
                <span>{t("retry") || (isRTL ? "إعادة المحاولة" : "Retry")}</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingColors && !colorsError && colors.length === 0 && (
            <div className="option-panel-empty">
              <div className="option-empty-icon" aria-hidden="true">
                <FiLayers />
              </div>
              <h3 className="option-empty-title">
                {t("noColorsFound") || (isRTL ? "لا توجد ألوان حالياً" : "No Colors Found")}
              </h3>
              <p className="option-empty-desc">
                {t("noColorsDesc") ||
                  (isRTL
                    ? "لم يتم إضافة أي ألوان للمتجر بعد. يمكنك إضافة أول لون الآن."
                    : "No product colors registered yet.")}
              </p>
            </div>
          )}

          {/* Colors Table */}
          {!loadingColors && !colorsError && colors.length > 0 && (
            <>
              <div className="option-table-wrap">
                <table className="option-data-table" aria-label="Colors List">
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>{t("nameAr") || (isRTL ? "الاسم بالعربية" : "Arabic Name")}</th>
                      <th>{t("nameEn") || (isRTL ? "الاسم بالإنجليزية" : "English Name")}</th>
                      <th>{t("status") || (isRTL ? "الحالة" : "Status")}</th>
                      <th>{t("createdAt") || (isRTL ? "تاريخ الإنشاء" : "Created At")}</th>
                      <th style={{ textAlign: "center" }}>{t("actions") || (isRTL ? "حذف" : "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map((color) => (
                      <tr key={color.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>#{color.id}</td>
                        <td style={{ fontWeight: 700 }}>{color.name_ar}</td>
                        <td>{color.name_en}</td>
                        <td>
                          <span className={`option-status-badge ${color.status ? "active" : "inactive"}`}>
                            <span className="option-status-dot" aria-hidden="true" />
                            <span>
                              {color.status
                                ? t("statusActive") || (isRTL ? "نشط" : "Active")
                                : t("statusInactive") || (isRTL ? "غير نشط" : "Inactive")}
                            </span>
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--vendo-gray-muted)" }}>
                          {formatDate(color.created_at, isRTL)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-option-delete"
                            title={t("delete") || (isRTL ? "حذف" : "Delete")}
                            aria-label={`Delete ${color.name_ar}`}
                            onClick={() => setColorToDelete(color)}
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination */}
              {colorsPagination.last_page > 1 && (
                <div className="pagination-bar" style={{ padding: "0.85rem 1rem" }}>
                  <div className="pagination-info" style={{ fontSize: "0.8rem" }}>
                    {`${colorsPage} / ${colorsPagination.last_page} (${colorsPagination.total})`}
                  </div>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="btn-page-step"
                      disabled={colorsPage <= 1 || loadingColors}
                      onClick={() => {
                        setLoadingColors(true);
                        setColorsPage((p) => Math.max(1, p - 1));
                      }}
                      aria-label="Previous page"
                    >
                      {isRTL ? <FiChevronRight aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
                    </button>

                    {Array.from({ length: colorsPagination.last_page }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`btn-page-number ${colorsPage === num ? "active" : ""}`}
                        disabled={loadingColors}
                        onClick={() => {
                          if (num !== colorsPage) {
                            setLoadingColors(true);
                            setColorsPage(num);
                          }
                        }}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn-page-step"
                      disabled={colorsPage >= colorsPagination.last_page || loadingColors}
                      onClick={() => {
                        setLoadingColors(true);
                        setColorsPage((p) => p + 1);
                      }}
                      aria-label="Next page"
                    >
                      {isRTL ? <FiChevronLeft aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ====================================================
            COLUMN 2: SIZES MANAGEMENT
            ==================================================== */}
        <div className="option-panel-card">
          <div className="option-panel-header">
            <div className="option-panel-title-wrap">
              <h2 className="option-panel-title">
                {t("sizesSectionTitle") || (isRTL ? "المقاسات" : "Sizes")}
              </h2>
              <span className="option-count-badge">
                {sizesPagination.total} {isRTL ? "مقاس" : "sizes"}
              </span>
            </div>

            <button
              type="button"
              className="btn-add-option"
              onClick={handleOpenSizeModal}
              id="btn-add-size"
            >
              <FiPlus aria-hidden="true" />
              <span>{t("addSize") || (isRTL ? "إضافة مقاس" : "Add Size")}</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {loadingSizes && (
            <div style={{ padding: "1.5rem" }}>
              <div className="skeleton-row" style={{ height: "40px" }} />
              <div className="skeleton-row" style={{ height: "45px" }} />
              <div className="skeleton-row" style={{ height: "45px" }} />
              <div className="skeleton-row" style={{ height: "45px" }} />
            </div>
          )}

          {/* Error State */}
          {!loadingSizes && sizesError && (
            <div className="option-panel-error">
              <div className="option-error-icon" aria-hidden="true">
                <FiAlertCircle />
              </div>
              <p className="option-error-text">{sizesError}</p>
              <button
                type="button"
                className="btn-orders-refresh"
                onClick={() => {
                  setLoadingSizes(true);
                  setSizesRefreshTrigger((prev) => prev + 1);
                }}
              >
                <FiRefreshCw aria-hidden="true" />
                <span>{t("retry") || (isRTL ? "إعادة المحاولة" : "Retry")}</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingSizes && !sizesError && sizes.length === 0 && (
            <div className="option-panel-empty">
              <div className="option-empty-icon" aria-hidden="true">
                <FiLayers />
              </div>
              <h3 className="option-empty-title">
                {t("noSizesFound") || (isRTL ? "لا توجد مقاسات حالياً" : "No Sizes Found")}
              </h3>
              <p className="option-empty-desc">
                {t("noSizesDesc") ||
                  (isRTL
                    ? "لم يتم إضافة أي مقاسات للمتجر بعد. يمكنك إضافة أول مقاس الآن."
                    : "No product sizes registered yet.")}
              </p>
            </div>
          )}

          {/* Sizes Table */}
          {!loadingSizes && !sizesError && sizes.length > 0 && (
            <>
              <div className="option-table-wrap">
                <table className="option-data-table" aria-label="Sizes List">
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>{t("nameLabel") || (isRTL ? "المقاس" : "Size")}</th>
                      <th>{t("status") || (isRTL ? "الحالة" : "Status")}</th>
                      <th>{t("createdAt") || (isRTL ? "تاريخ الإنشاء" : "Created At")}</th>
                      <th style={{ textAlign: "center" }}>{t("actions") || (isRTL ? "حذف" : "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size) => (
                      <tr key={size.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>#{size.id}</td>
                        <td style={{ fontWeight: 800, color: "var(--vendo-primary)" }}>{size.name}</td>
                        <td>
                          <span className={`option-status-badge ${size.status ? "active" : "inactive"}`}>
                            <span className="option-status-dot" aria-hidden="true" />
                            <span>
                              {size.status
                                ? t("statusActive") || (isRTL ? "نشط" : "Active")
                                : t("statusInactive") || (isRTL ? "غير نشط" : "Inactive")}
                            </span>
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--vendo-gray-muted)" }}>
                          {formatDate(size.created_at, isRTL)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-option-delete"
                            title={t("delete") || (isRTL ? "حذف" : "Delete")}
                            aria-label={`Delete ${size.name}`}
                            onClick={() => setSizeToDelete(size)}
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination */}
              {sizesPagination.last_page > 1 && (
                <div className="pagination-bar" style={{ padding: "0.85rem 1rem" }}>
                  <div className="pagination-info" style={{ fontSize: "0.8rem" }}>
                    {`${sizesPage} / ${sizesPagination.last_page} (${sizesPagination.total})`}
                  </div>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="btn-page-step"
                      disabled={sizesPage <= 1 || loadingSizes}
                      onClick={() => {
                        setLoadingSizes(true);
                        setSizesPage((p) => Math.max(1, p - 1));
                      }}
                      aria-label="Previous page"
                    >
                      {isRTL ? <FiChevronRight aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
                    </button>

                    {Array.from({ length: sizesPagination.last_page }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`btn-page-number ${sizesPage === num ? "active" : ""}`}
                        disabled={loadingSizes}
                        onClick={() => {
                          if (num !== sizesPage) {
                            setLoadingSizes(true);
                            setSizesPage(num);
                          }
                        }}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn-page-step"
                      disabled={sizesPage >= sizesPagination.last_page || loadingSizes}
                      onClick={() => {
                        setLoadingSizes(true);
                        setSizesPage((p) => p + 1);
                      }}
                      aria-label="Next page"
                    >
                      {isRTL ? <FiChevronLeft aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ====================================================
          MODAL 1: CREATE COLOR
          ==================================================== */}
      {isColorModalOpen && (
        <div className="option-modal-overlay" onClick={handleCloseColorModal}>
          <div
            className="option-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-color-title"
          >
            <div className="option-modal-header">
              <h3 id="modal-color-title" className="option-modal-title">
                {t("addColor") || (isRTL ? "إضافة لون جديد" : "Add New Color")}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseColorModal}
                disabled={isSubmittingColor}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateColorSubmit} noValidate>
              <div className="option-modal-body">
                <div className="option-form-group">
                  <label htmlFor="color_name_ar" className="option-form-label">
                    {t("nameAr") || (isRTL ? "الاسم بالعربية" : "Arabic Name")} *
                  </label>
                  <input
                    id="color_name_ar"
                    type="text"
                    dir="rtl"
                    className={`option-form-input ${colorFormErrors.name_ar ? "input-error" : ""}`}
                    value={colorForm.name_ar}
                    onChange={(e) => {
                      setColorForm((prev) => ({ ...prev, name_ar: e.target.value }));
                      if (colorFormErrors.name_ar) {
                        setColorFormErrors((prev) => ({ ...prev, name_ar: null }));
                      }
                    }}
                    placeholder={isRTL ? "مثال: أصفر، كحلي..." : "e.g. أصفر"}
                    disabled={isSubmittingColor}
                  />
                  {colorFormErrors.name_ar && (
                    <span className="option-input-error-msg">{colorFormErrors.name_ar}</span>
                  )}
                </div>

                <div className="option-form-group">
                  <label htmlFor="color_name_en" className="option-form-label">
                    {t("nameEn") || (isRTL ? "الاسم بالإنجليزية" : "English Name")} *
                  </label>
                  <input
                    id="color_name_en"
                    type="text"
                    dir="ltr"
                    className={`option-form-input ${colorFormErrors.name_en ? "input-error" : ""}`}
                    value={colorForm.name_en}
                    onChange={(e) => {
                      setColorForm((prev) => ({ ...prev, name_en: e.target.value }));
                      if (colorFormErrors.name_en) {
                        setColorFormErrors((prev) => ({ ...prev, name_en: null }));
                      }
                    }}
                    placeholder="e.g. Yellow, Navy..."
                    disabled={isSubmittingColor}
                  />
                  {colorFormErrors.name_en && (
                    <span className="option-input-error-msg">{colorFormErrors.name_en}</span>
                  )}
                </div>
              </div>

              <div className="option-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseColorModal}
                  disabled={isSubmittingColor}
                >
                  {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmittingColor}
                >
                  {isSubmittingColor ? (
                    <>
                      <FiRefreshCw className="spin-icon" aria-hidden="true" />
                      <span>{t("creatingColor") || (isRTL ? "جاري الإضافة..." : "Creating...")}</span>
                    </>
                  ) : (
                    <span>{t("addColor") || (isRTL ? "إضافة اللون" : "Add Color")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 2: CREATE SIZE
          ==================================================== */}
      {isSizeModalOpen && (
        <div className="option-modal-overlay" onClick={handleCloseSizeModal}>
          <div
            className="option-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-size-title"
          >
            <div className="option-modal-header">
              <h3 id="modal-size-title" className="option-modal-title">
                {t("addSize") || (isRTL ? "إضافة مقاس جديد" : "Add New Size")}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseSizeModal}
                disabled={isSubmittingSize}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateSizeSubmit} noValidate>
              <div className="option-modal-body">
                <div className="option-form-group">
                  <label htmlFor="size_name" className="option-form-label">
                    {t("nameLabel") || (isRTL ? "اسم المقاس" : "Size Name")} *
                  </label>
                  <input
                    id="size_name"
                    type="text"
                    className={`option-form-input ${sizeFormErrors.name ? "input-error" : ""}`}
                    value={sizeForm.name}
                    onChange={(e) => {
                      setSizeForm({ name: e.target.value });
                      if (sizeFormErrors.name) {
                        setSizeFormErrors({});
                      }
                    }}
                    placeholder={isRTL ? "مثال: S, M, L, XL, XXL..." : "e.g. XXL, XL, 32..."}
                    disabled={isSubmittingSize}
                  />
                  {sizeFormErrors.name && (
                    <span className="option-input-error-msg">{sizeFormErrors.name}</span>
                  )}
                </div>
              </div>

              <div className="option-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseSizeModal}
                  disabled={isSubmittingSize}
                >
                  {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmittingSize}
                >
                  {isSubmittingSize ? (
                    <>
                      <FiRefreshCw className="spin-icon" aria-hidden="true" />
                      <span>{t("creatingSize") || (isRTL ? "جاري الإضافة..." : "Creating...")}</span>
                    </>
                  ) : (
                    <span>{t("addSize") || (isRTL ? "إضافة المقاس" : "Add Size")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 3: DELETE COLOR CONFIRMATION
          ==================================================== */}
      {colorToDelete && (
        <div className="option-modal-overlay" onClick={() => !isDeletingColor && setColorToDelete(null)}>
          <div
            className="option-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-color-title"
          >
            <div className="option-modal-header">
              <h3 id="confirm-delete-color-title" className="option-modal-title" style={{ color: "#ef4444" }}>
                {t("confirmDeleteColorTitle") || (isRTL ? "تأكيد حذف اللون" : "Confirm Color Deletion")}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => !isDeletingColor && setColorToDelete(null)}
                disabled={isDeletingColor}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="option-modal-body">
              <p style={{ margin: 0, color: "var(--vendo-gray-body)", lineHeight: 1.6 }}>
                {t("confirmDeleteColorMessage") ||
                  (isRTL
                    ? "هل أنت متأكد من حذف هذا اللون؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete this color?")}
              </p>
              <div
                style={{
                  backgroundColor: "var(--vendo-bg-alt)",
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <span>{colorToDelete.name_ar}</span>
                <span>/</span>
                <span>{colorToDelete.name_en}</span>
              </div>
            </div>

            <div className="option-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setColorToDelete(null)}
                disabled={isDeletingColor}
              >
                {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="button"
                className="btn-modal-submit btn-modal-danger"
                onClick={handleDeleteColorConfirm}
                disabled={isDeletingColor}
              >
                {isDeletingColor ? (
                  <>
                    <FiRefreshCw className="spin-icon" aria-hidden="true" />
                    <span>{t("deletingOption") || (isRTL ? "جاري الحذف..." : "Deleting...")}</span>
                  </>
                ) : (
                  <span>{t("btnDelete") || (isRTL ? "تأكيد الحذف" : "Delete")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 4: DELETE SIZE CONFIRMATION
          ==================================================== */}
      {sizeToDelete && (
        <div className="option-modal-overlay" onClick={() => !isDeletingSize && setSizeToDelete(null)}>
          <div
            className="option-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-size-title"
          >
            <div className="option-modal-header">
              <h3 id="confirm-delete-size-title" className="option-modal-title" style={{ color: "#ef4444" }}>
                {t("confirmDeleteSizeTitle") || (isRTL ? "تأكيد حذف المقاس" : "Confirm Size Deletion")}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => !isDeletingSize && setSizeToDelete(null)}
                disabled={isDeletingSize}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="option-modal-body">
              <p style={{ margin: 0, color: "var(--vendo-gray-body)", lineHeight: 1.6 }}>
                {t("confirmDeleteSizeMessage") ||
                  (isRTL
                    ? "هل أنت متأكد من حذف هذا المقاس؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete this size?")}
              </p>
              <div
                style={{
                  backgroundColor: "var(--vendo-bg-alt)",
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 800,
                  color: "var(--vendo-primary)",
                  fontSize: "1.1rem",
                }}
              >
                {sizeToDelete.name}
              </div>
            </div>

            <div className="option-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSizeToDelete(null)}
                disabled={isDeletingSize}
              >
                {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="button"
                className="btn-modal-submit btn-modal-danger"
                onClick={handleDeleteSizeConfirm}
                disabled={isDeletingSize}
              >
                {isDeletingSize ? (
                  <>
                    <FiRefreshCw className="spin-icon" aria-hidden="true" />
                    <span>{t("deletingOption") || (isRTL ? "جاري الحذف..." : "Deleting...")}</span>
                  </>
                ) : (
                  <span>{t("btnDelete") || (isRTL ? "تأكيد الحذف" : "Delete")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardColorsSizes;
