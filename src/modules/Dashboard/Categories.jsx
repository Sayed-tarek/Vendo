import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import {
  FiLayers,
  FiPlus,
  FiUploadCloud,
  FiTrash2,
  FiAlertCircle,
  FiLoader,
  FiEdit2,
  FiEye,
  FiImage,
  FiPackage,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getCategories,
  createCategory,
  showCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categoryService";
import "./Categories.css";

export function DashboardCategories() {
  const { t, isRTL } = useTranslation();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Categories list & pagination state
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState("");
  const [showCreateCard, setShowCreateCard] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [loadingEditDetails, setLoadingEditDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editCurrentImageUrl, setEditCurrentImageUrl] = useState(null);
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [editFileError, setEditFileError] = useState("");

  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [loadingViewDetails, setLoadingViewDetails] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form hook for Create Category
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  });

  // Form hook for Edit Category
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setError: setEditError,
    clearErrors: clearEditErrors,
    setValue: setEditValue,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm({
    mode: "onBlur",
  });

  // Fetch categories with server-side pagination
  const fetchCategoriesList = useCallback(
    async (page = 1) => {
      try {
        setLoadingCategories(true);
        setFetchError("");
        const response = await getCategories(page);

        // Expected response: { success: true, message: "...", data: [...], pagination: { current_page, last_page, per_page, total } }
        if (response && response.data) {
          setCategories(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
            setCurrentPage(response.pagination.current_page || page);
          }
        }
      } catch (err) {
        console.error("Fetch categories error:", err);
        setFetchError(
          t("errorLoadingCategories") || "تعذر تحميل الأقسام، حاول مرة أخرى."
        );
      } finally {
        setLoadingCategories(false);
      }
    },
    [t]
  );

  // Initial load on mount
  useEffect(() => {
    fetchCategoriesList(1);
  }, [fetchCategoriesList]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.last_page &&
      newPage !== currentPage &&
      !loadingCategories
    ) {
      fetchCategoriesList(newPage);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr.split("T")[0] || dateStr;
    }
  };

  // Handle local image file selection for Create
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError(
        isRTL
          ? "يرجى اختيار صورة بصيغة صالحة (JPEG, PNG, WEBP)"
          : "Please select a valid image format (JPEG, PNG, WEBP)"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError(
        isRTL
          ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت"
          : "Image size must not exceed 5MB"
      );
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileError("");
  };

  // Remove selected image for Create
  const handleRemoveImage = () => {
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle local image file selection for Edit
  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setEditFileError(
        isRTL
          ? "يرجى اختيار صورة بصيغة صالحة (JPEG, PNG, WEBP)"
          : "Please select a valid image format (JPEG, PNG, WEBP)"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditFileError(
        isRTL
          ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت"
          : "Image size must not exceed 5MB"
      );
      return;
    }

    setEditSelectedFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
    setEditFileError("");
  };

  // Remove / Revert newly selected edit image
  const handleRemoveEditImage = () => {
    if (editPreviewUrl && !editPreviewUrl.startsWith("http")) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditSelectedFile(null);
    setEditPreviewUrl(null);
    setEditFileError("");
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  // ====================================================
  // CREATE CATEGORY HANDLER
  // ====================================================
  const onSubmit = async (data) => {
    if (!selectedFile) {
      setFileError(
        isRTL ? "صورة القسم مطلوبة" : "Category image is required"
      );
      return;
    }

    const formData = new FormData();
    formData.append("name_ar", data.name_ar.trim());
    formData.append("name_en", data.name_en.trim());
    formData.append("image", selectedFile);

    try {
      const response = await createCategory(formData);
      console.log("Create Category Response:", response?.data || response);

      toast.success(
        t("categoryCreatedSuccess") || "تم إضافة القسم بنجاح"
      );

      reset({
        name_ar: "",
        name_en: "",
      });
      handleRemoveImage();

      await fetchCategoriesList(1);
    } catch (error) {
      console.error("Create category error:", error);

      if (error.response) {
        const { status, data: resData } = error.response;

        if (status === 422 && resData?.errors) {
          const apiErrors = resData.errors;
          if (apiErrors.name_ar) {
            setError("name_ar", {
              type: "server",
              message: apiErrors.name_ar[0],
            });
          }
          if (apiErrors.name_en) {
            setError("name_en", {
              type: "server",
              message: apiErrors.name_en[0],
            });
          }
          if (apiErrors.image) {
            setFileError(apiErrors.image[0]);
          }
          toast.error(
            isRTL
              ? "يرجى التحقق من صحة البيانات المدخلة"
              : "Please correct the input errors"
          );
          return;
        }

        if (status === 401) {
          toast.error(
            isRTL
              ? "انتهت جلسة تسجيل الدخول، يرجى إعادة تسجيل الدخول"
              : "Session expired. Please log in again."
          );
          return;
        }

        if (status === 403) {
          toast.error(
            isRTL
              ? "ليس لديك صلاحية للقيام بهذه العملية (Admin Only)"
              : "You do not have permission to perform this action"
          );
          return;
        }

        toast.error(
          resData?.message ||
            (isRTL ? "حدث خطأ أثناء إضافة القسم" : "Failed to create category")
        );
      } else {
        toast.error(
          isRTL
            ? "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً"
            : "Network error. Please try again later."
        );
      }
    }
  };

  // ====================================================
  // SHOW CATEGORY / VIEW DETAILS
  // ====================================================
  const handleOpenView = async (id) => {
    setIsViewModalOpen(true);
    setLoadingViewDetails(true);
    setViewingCategory(null);

    try {
      const res = await showCategory(id);
      // Response format: { success: true, message: "...", data: { id, name_ar, name_en, image, status, products_count, created_at, updated_at } }
      const catData = res?.data?.data || res?.data;
      setViewingCategory(catData);
    } catch (err) {
      console.error("Fetch category details error:", err);
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "تعذر جلب تفاصيل القسم" : "Failed to fetch category details")
      );
      setIsViewModalOpen(false);
    } finally {
      setLoadingViewDetails(false);
    }
  };

  const handleCloseView = () => {
    setIsViewModalOpen(false);
    setViewingCategory(null);
  };

  // ====================================================
  // EDIT FLOW: FETCH & PREFILL
  // ====================================================
  const handleOpenEdit = async (id) => {
    setIsEditModalOpen(true);
    setEditingCategoryId(id);
    setLoadingEditDetails(true);
    setEditFileError("");
    setEditSelectedFile(null);
    setEditPreviewUrl(null);
    setEditCurrentImageUrl(null);
    resetEdit({ name_ar: "", name_en: "" });

    try {
      const res = await showCategory(id);
      const catData = res?.data?.data || res?.data;
      if (catData) {
        setEditValue("name_ar", catData.name_ar || "");
        setEditValue("name_en", catData.name_en || "");
        setEditCurrentImageUrl(catData.image || null);
      }
    } catch (err) {
      console.error("Error loading category for edit:", err);
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "تعذر جلب بيانات القسم للتعديل" : "Failed to load category data")
      );
      setIsEditModalOpen(false);
    } finally {
      setLoadingEditDetails(false);
    }
  };

  const handleCloseEdit = () => {
    if (isUpdating) return;
    setIsEditModalOpen(false);
    setEditingCategoryId(null);
    if (editPreviewUrl && !editPreviewUrl.startsWith("http")) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditSelectedFile(null);
    setEditPreviewUrl(null);
    setEditCurrentImageUrl(null);
    setEditFileError("");
    resetEdit();
  };

  // ====================================================
  // UPDATE CATEGORY HANDLER
  // ====================================================
  const onEditSubmit = async (data) => {
    if (!editingCategoryId || isUpdating) return;

    // STEP 9 & 10: image is optional! Only append if user selected a new File.
    // Do NOT send image URL string as File!
    const formData = new FormData();
    formData.append("name_ar", data.name_ar.trim());
    formData.append("name_en", data.name_en.trim());
    if (editSelectedFile) {
      formData.append("image", editSelectedFile);
    }

    try {
      setIsUpdating(true);
      const res = await updateCategory(editingCategoryId, formData);
      console.log("Update Category Response:", res);

      toast.success(t("categoryUpdatedSuccess") || "تم تحديث القسم بنجاح");
      handleCloseEdit();

      // Refetch current page to update data without page reload
      await fetchCategoriesList(currentPage);
    } catch (error) {
      console.error("Update category error:", error);

      if (error.response) {
        const { status, data: resData } = error.response;

        if (status === 422 && resData?.errors) {
          const apiErrors = resData.errors;
          if (apiErrors.name_ar) {
            setEditError("name_ar", {
              type: "server",
              message: apiErrors.name_ar[0],
            });
          }
          if (apiErrors.name_en) {
            setEditError("name_en", {
              type: "server",
              message: apiErrors.name_en[0],
            });
          }
          if (apiErrors.image) {
            setEditFileError(apiErrors.image[0]);
          }
          toast.error(
            isRTL
              ? "يرجى التحقق من صحة البيانات المدخلة"
              : "Please correct the input errors"
          );
          return;
        }

        if (status === 401) {
          toast.error(
            isRTL
              ? "انتهت جلسة تسجيل الدخول، يرجى إعادة تسجيل الدخول"
              : "Session expired. Please log in again."
          );
          return;
        }

        if (status === 403) {
          toast.error(
            isRTL
              ? "ليس لديك صلاحية للقيام بهذه العملية (Admin Only)"
              : "You do not have permission to perform this action"
          );
          return;
        }

        if (status === 404) {
          toast.error(
            isRTL ? "القسم المطلوب غير موجود" : "Category not found"
          );
          handleCloseEdit();
          return;
        }

        toast.error(
          resData?.message ||
            (isRTL ? "حدث خطأ أثناء تعديل القسم" : "Failed to update category")
        );
      } else {
        toast.error(
          isRTL
            ? "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً"
            : "Network error. Please try again later."
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // ====================================================
  // DELETE CATEGORY HANDLER
  // ====================================================
  const handleOpenDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteCategory(categoryToDelete.id);

      toast.success(t("categoryDeletedSuccess") || "تم حذف القسم بنجاح");
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);

      // STEP 28: If user deleted the last item on the page and currentPage > 1, go to previous page
      const targetPage =
        categories.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await fetchCategoriesList(targetPage);
    } catch (error) {
      console.error("Delete category error:", error);

      if (error.response) {
        const { status, data: resData } = error.response;
        if (status === 401) {
          toast.error(
            isRTL
              ? "انتهت جلسة تسجيل الدخول، يرجى إعادة تسجيل الدخول"
              : "Session expired. Please log in again."
          );
          return;
        }
        if (status === 403) {
          toast.error(
            isRTL
              ? "ليس لديك صلاحية لحذف القسم (Admin Only)"
              : "You do not have permission to delete this category"
          );
          return;
        }
        // Specific error message from backend (e.g. category has linked products)
        toast.error(
          resData?.message ||
            (isRTL ? "تعذر حذف القسم، يرجى المحاولة لاحقاً" : "Failed to delete category")
        );
      } else {
        toast.error(
          isRTL
            ? "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً"
            : "Network error. Please try again later."
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="categories-container" aria-label="Categories Management Page">
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      {/* Page Header */}
      <div className="categories-top-header">
        <div className="categories-header-info">
          <h1>{t("categoriesTitle")}</h1>
          <p>{t("categoriesSubtitle")}</p>
        </div>

        <button
          type="button"
          className="btn-toggle-create"
          onClick={() => setShowCreateCard((prev) => !prev)}
          aria-expanded={showCreateCard}
        >
          <FiPlus />
          <span>
            {showCreateCard
              ? t("hideForm")
              : `+ ${t("addCategory")}`}
          </span>
        </button>
      </div>

      {/* Create Category Form Card */}
      {showCreateCard && (
        <div className="category-create-card">
          <h2 className="create-card-title">
            <FiLayers />
            <span>{t("createCategoryCardTitle")}</span>
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="category-form-grid">
              {/* Left Column: Text Inputs */}
              <div>
                {/* Arabic Name */}
                <div className="cat-form-group">
                  <label htmlFor="name_ar" className="cat-form-label">
                    <span>{t("categoryNameAr")}</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="name_ar"
                    type="text"
                    placeholder={
                      isRTL
                        ? "مثال: ملابس، إلكترونيات، مستلزمات منزلية..."
                        : "e.g. Men's Clothes, Electronics..."
                    }
                    className={`cat-form-input ${errors.name_ar ? "has-error" : ""}`}
                    {...register("name_ar", {
                      required: isRTL
                        ? "اسم القسم بالعربية مطلوب"
                        : "Arabic name is required",
                      minLength: {
                        value: 2,
                        message: isRTL
                          ? "يجب ألا يقل الاسم عن حرفين"
                          : "Name must be at least 2 characters",
                      },
                      onChange: () => {
                        if (errors.name_ar) clearErrors("name_ar");
                      },
                    })}
                  />
                  {errors.name_ar && (
                    <div className="cat-error-message">
                      <FiAlertCircle />
                      <span>{errors.name_ar.message}</span>
                    </div>
                  )}
                </div>

                {/* English Name */}
                <div className="cat-form-group">
                  <label htmlFor="name_en" className="cat-form-label">
                    <span>{t("categoryNameEn")}</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="name_en"
                    type="text"
                    dir="ltr"
                    placeholder="e.g. Clothes, Electronics, Home Essentials..."
                    className={`cat-form-input ${errors.name_en ? "has-error" : ""}`}
                    {...register("name_en", {
                      required: isRTL
                        ? "اسم القسم بالإنجليزية مطلوب"
                        : "English name is required",
                      minLength: {
                        value: 2,
                        message: isRTL
                          ? "يجب ألا يقل الاسم عن حرفين"
                          : "Name must be at least 2 characters",
                      },
                      onChange: () => {
                        if (errors.name_en) clearErrors("name_en");
                      },
                    })}
                  />
                  {errors.name_en && (
                    <div className="cat-error-message">
                      <FiAlertCircle />
                      <span>{errors.name_en.message}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-submit-category"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="spin-animation" />
                      <span>{t("addingCategory")}</span>
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      <span>{t("submitCategory")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Image Upload & Live Preview */}
              <div className="image-upload-wrapper">
                <label className="cat-form-label">
                  <span>{t("categoryImage")}</span>
                  <span className="required-star">*</span>
                </label>

                {!previewUrl ? (
                  <div
                    className={`image-dropzone ${fileError ? "has-error" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden-file-input"
                      onChange={handleFileChange}
                    />
                    <div className="dropzone-icon">
                      <FiUploadCloud />
                    </div>
                    <span className="dropzone-text-main">
                      {t("clickToUpload")}
                    </span>
                    <span className="dropzone-text-sub">
                      {t("categoryImageHint")}
                    </span>
                  </div>
                ) : (
                  <div className="image-preview-box">
                    <img
                      src={previewUrl}
                      alt="Category Preview"
                      className="preview-img-element"
                    />
                    <div className="preview-img-footer">
                      <div className="preview-file-meta">
                        <span className="preview-file-name" title={selectedFile?.name}>
                          {selectedFile?.name || "category_image.jpg"}
                        </span>
                        <span className="preview-file-size">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : ""}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn-remove-image"
                        title={t("changeImage")}
                      >
                        <FiTrash2 />
                        <span>{t("changeImage")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div className="cat-error-message">
                    <FiAlertCircle />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Categories List Table Card */}
      <div className="categories-list-card">
        <div className="list-card-header">
          <h3 className="list-card-title">{t("currentCategoriesList")}</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--vendo-gray-muted)" }}>
            {`${t("totalCategoriesCount")}: ${pagination.total}`}
          </span>
        </div>

        {/* 1. Loading State */}
        {loadingCategories && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-blue">
              <FiLoader className="spin-animation" />
            </div>
            <h4 className="state-title">{t("loadingCategories")}</h4>
          </div>
        )}

        {/* 2. Error State */}
        {!loadingCategories && fetchError && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-red">
              <FiAlertCircle />
            </div>
            <h4 className="state-title">{fetchError}</h4>
            <button
              type="button"
              className="btn-retry-fetch"
              onClick={() => fetchCategoriesList(currentPage)}
            >
              <FiRefreshCw />
              <span>{t("btnRetry")}</span>
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!loadingCategories && !fetchError && categories.length === 0 && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-gray">
              <FiLayers />
            </div>
            <h4 className="state-title">{t("noCategories")}</h4>
            <p className="state-desc">{t("noCategoriesDesc")}</p>
            <button
              type="button"
              className="btn-retry-fetch"
              onClick={() => setShowCreateCard(true)}
            >
              <FiPlus />
              <span>{t("addCategory")}</span>
            </button>
          </div>
        )}

        {/* 4. Table Display */}
        {!loadingCategories && !fetchError && categories.length > 0 && (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>{t("tableColId")}</th>
                    <th style={{ width: "80px" }}>{t("tableColImage")}</th>
                    <th>{t("tableColNameAr")}</th>
                    <th>{t("tableColNameEn")}</th>
                    <th>{t("tableColProducts")}</th>
                    <th>{t("tableColStatus")}</th>
                    <th>{t("tableColCreatedAt")}</th>
                    <th style={{ textAlign: "center" }}>{t("tableColActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: 700, color: "var(--vendo-gray-muted)" }}>
                        #{cat.id}
                      </td>

                      {/* Image or Placeholder fallback */}
                      <td>
                        {cat.image ? (
                          <div style={{ position: "relative", width: "44px", height: "44px" }}>
                            <img
                              src={cat.image}
                              alt={cat.name_ar}
                              className="category-table-thumbnail"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                            <div
                              className="category-placeholder-thumbnail"
                              style={{ display: "none" }}
                              title="No Image"
                            >
                              <FiImage />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="category-placeholder-thumbnail"
                            title="No Image"
                          >
                            <FiImage />
                          </div>
                        )}
                      </td>

                      {/* Arabic Name */}
                      <td style={{ fontWeight: 700, color: "var(--vendo-dark)" }}>
                        {cat.name_ar}
                      </td>

                      {/* English Name */}
                      <td>
                        <span dir="ltr">{cat.name_en}</span>
                      </td>

                      {/* Products Count */}
                      <td>
                        <span className="badge-products-count">
                          <FiPackage size={13} style={{ color: "var(--vendo-primary)" }} />
                          <span>{cat.products_count ?? 0}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        {cat.status ? (
                          <span className="dash-badge-status dash-badge-active">
                            {t("statusActive")}
                          </span>
                        ) : (
                          <span className="dash-badge-status dash-badge-inactive">
                            {t("statusInactive")}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td style={{ fontSize: "0.85rem", color: "var(--vendo-gray-muted)" }}>
                        {formatDate(cat.created_at)}
                      </td>

                      {/* Actions: View / Edit / Delete */}
                      <td style={{ textAlign: "center" }}>
                        <div className="category-actions-group">
                          {/* View Category */}
                          <button
                            type="button"
                            className="btn-cat-action btn-action-view"
                            title={t("viewCategory")}
                            onClick={() => handleOpenView(cat.id)}
                            aria-label={`${t("viewCategory")} ${cat.name_ar}`}
                          >
                            <FiEye />
                          </button>

                          {/* Edit Category */}
                          <button
                            type="button"
                            className="btn-cat-action btn-action-edit"
                            title={t("editCategory")}
                            onClick={() => handleOpenEdit(cat.id)}
                            aria-label={`${t("editCategory")} ${cat.name_ar}`}
                          >
                            <FiEdit2 />
                          </button>

                          {/* Delete Category */}
                          <button
                            type="button"
                            className="btn-cat-action btn-action-delete"
                            title={t("deleteCategory")}
                            onClick={() => handleOpenDelete(cat)}
                            aria-label={`${t("deleteCategory")} ${cat.name_ar}`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.last_page > 1 && (
              <div className="pagination-bar" aria-label="Pagination Navigation">
                <div className="pagination-info">
                  {`${t("paginationPage")} ${currentPage} ${t("paginationOf")} ${pagination.last_page} (${t("totalCategoriesCount")}: ${pagination.total})`}
                </div>

                <div className="pagination-controls">
                  {/* Previous Button */}
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPage <= 1 || loadingCategories}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Previous Page"
                  >
                    {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
                    <span>{t("paginationPrev")}</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`btn-page-number ${pageNum === currentPage ? "active" : ""}`}
                        disabled={loadingCategories}
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={pageNum === currentPage ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  {/* Next Button */}
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPage >= pagination.last_page || loadingCategories}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Next Page"
                  >
                    <span>{t("paginationNext")}</span>
                    {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================================================
          1. EDIT CATEGORY MODAL
          ==================================================== */}
      {isEditModalOpen && (
        <div
          className="vendo-modal-backdrop"
          onClick={handleCloseEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="edit-category-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-blue">
                  <FiEdit2 />
                </div>
                <span>{t("editCategory")}</span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseEdit}
                disabled={isUpdating}
                aria-label={t("close")}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            {loadingEditDetails ? (
              <div className="table-state-box" style={{ padding: "3rem 1.5rem" }}>
                <div className="state-icon-box state-icon-blue">
                  <FiLoader className="spin-animation" />
                </div>
                <h4 className="state-title">{t("loadingDetails")}</h4>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit(onEditSubmit)} noValidate>
                <div className="vendo-modal-body">
                  {/* Arabic Name */}
                  <div className="cat-form-group">
                    <label htmlFor="edit_name_ar" className="cat-form-label">
                      <span>{t("categoryNameAr")}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      id="edit_name_ar"
                      type="text"
                      className={`cat-form-input ${editErrors.name_ar ? "has-error" : ""}`}
                      {...registerEdit("name_ar", {
                        required: isRTL
                          ? "اسم القسم بالعربية مطلوب"
                          : "Arabic name is required",
                        minLength: {
                          value: 2,
                          message: isRTL
                            ? "يجب ألا يقل الاسم عن حرفين"
                            : "Name must be at least 2 characters",
                        },
                        onChange: () => {
                          if (editErrors.name_ar) clearEditErrors("name_ar");
                        },
                      })}
                    />
                    {editErrors.name_ar && (
                      <div className="cat-error-message">
                        <FiAlertCircle />
                        <span>{editErrors.name_ar.message}</span>
                      </div>
                    )}
                  </div>

                  {/* English Name */}
                  <div className="cat-form-group">
                    <label htmlFor="edit_name_en" className="cat-form-label">
                      <span>{t("categoryNameEn")}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      id="edit_name_en"
                      type="text"
                      dir="ltr"
                      className={`cat-form-input ${editErrors.name_en ? "has-error" : ""}`}
                      {...registerEdit("name_en", {
                        required: isRTL
                          ? "اسم القسم بالإنجليزية مطلوب"
                          : "English name is required",
                        minLength: {
                          value: 2,
                          message: isRTL
                            ? "يجب ألا يقل الاسم عن حرفين"
                            : "Name must be at least 2 characters",
                        },
                        onChange: () => {
                          if (editErrors.name_en) clearEditErrors("name_en");
                        },
                      })}
                    />
                    {editErrors.name_en && (
                      <div className="cat-error-message">
                        <FiAlertCircle />
                        <span>{editErrors.name_en.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Image Section (Current vs Optional New) */}
                  <div className="cat-form-group" style={{ marginBottom: 0 }}>
                    <label className="cat-form-label">
                      <span>{t("categoryImage")}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--vendo-gray-muted)", marginInlineStart: "0.4rem" }}>
                        ({t("changeImageOptional")})
                      </span>
                    </label>

                    <div className="edit-image-container">
                      {/* Current Image */}
                      <div className="edit-image-col">
                        <span className="edit-image-col-title">{t("currentImage")}</span>
                        <div className="edit-current-image-wrapper">
                          {editCurrentImageUrl ? (
                            <img
                              src={editCurrentImageUrl}
                              alt="Current Category"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="category-placeholder-thumbnail"
                            style={{
                              display: editCurrentImageUrl ? "none" : "flex",
                              width: "100%",
                              height: "100%",
                              borderRadius: 0,
                            }}
                          >
                            <FiImage size={24} />
                          </div>
                        </div>
                      </div>

                      {/* New Image Upload or Preview */}
                      <div className="edit-image-col">
                        <span className="edit-image-col-title">{t("newImage")}</span>
                        {!editPreviewUrl ? (
                          <div
                            className="edit-upload-box"
                            onClick={() => editFileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                editFileInputRef.current?.click();
                              }
                            }}
                          >
                            <input
                              ref={editFileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden-file-input"
                              onChange={handleEditFileChange}
                            />
                            <FiUploadCloud size={24} style={{ color: "var(--vendo-primary)" }} />
                            <span>{t("clickToUpload")}</span>
                            <small>{t("categoryImageHint")}</small>
                          </div>
                        ) : (
                          <div className="edit-new-image-preview">
                            <img src={editPreviewUrl} alt="New Category Preview" />
                            <button
                              type="button"
                              className="btn-remove-edit-image"
                              onClick={handleRemoveEditImage}
                              title={t("btnCancel")}
                            >
                              <FiX />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: "0.78rem", color: "var(--vendo-gray-muted)", margin: "0.5rem 0 0 0" }}>
                      {t("keepCurrentImageHint")}
                    </p>

                    {editFileError && (
                      <div className="cat-error-message">
                        <FiAlertCircle />
                        <span>{editFileError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="vendo-modal-footer">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseEdit}
                    disabled={isUpdating}
                  >
                    {t("btnCancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-save"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <FiLoader className="spin-animation" />
                        <span>{t("saving")}</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        <span>{t("saveChanges")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          2. VIEW CATEGORY DETAILS MODAL
          ==================================================== */}
      {isViewModalOpen && (
        <div
          className="vendo-modal-backdrop"
          onClick={handleCloseView}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-category-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="view-category-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-blue">
                  <FiEye />
                </div>
                <span>{t("viewCategory")}</span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseView}
                aria-label={t("close")}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vendo-modal-body">
              {loadingViewDetails ? (
                <div className="table-state-box" style={{ padding: "3rem 1.5rem" }}>
                  <div className="state-icon-box state-icon-blue">
                    <FiLoader className="spin-animation" />
                  </div>
                  <h4 className="state-title">{t("loadingDetails")}</h4>
                </div>
              ) : viewingCategory ? (
                <div className="view-details-grid">
                  {/* Category Image */}
                  <div className="view-details-image-box">
                    {viewingCategory.image ? (
                      <img
                        src={viewingCategory.image}
                        alt={viewingCategory.name_ar}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="category-placeholder-thumbnail"
                      style={{
                        display: viewingCategory.image ? "none" : "flex",
                        width: "100%",
                        height: "100%",
                        borderRadius: 0,
                      }}
                    >
                      <FiImage size={32} />
                    </div>
                  </div>

                  {/* Category Attributes List */}
                  <div className="view-details-list">
                    <div className="view-detail-row">
                      <span className="view-detail-label">{t("detailsId")}</span>
                      <span className="view-detail-value">#{viewingCategory.id}</span>
                    </div>

                    <div className="view-detail-row">
                      <span className="view-detail-label">{t("categoryNameAr")}</span>
                      <span className="view-detail-value">{viewingCategory.name_ar}</span>
                    </div>

                    <div className="view-detail-row">
                      <span className="view-detail-label">{t("categoryNameEn")}</span>
                      <span className="view-detail-value" dir="ltr">
                        {viewingCategory.name_en}
                      </span>
                    </div>

                    <div className="view-detail-row">
                      <span className="view-detail-label">{t("tableColProducts")}</span>
                      <span className="badge-products-count">
                        <FiPackage size={13} style={{ color: "var(--vendo-primary)" }} />
                        <span>{viewingCategory.products_count ?? 0}</span>
                      </span>
                    </div>

                    <div className="view-detail-row">
                      <span className="view-detail-label">{t("tableColStatus")}</span>
                      <span>
                        {viewingCategory.status ? (
                          <span className="dash-badge-status dash-badge-active">
                            {t("statusActive")}
                          </span>
                        ) : (
                          <span className="dash-badge-status dash-badge-inactive">
                            {t("statusInactive")}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="view-detail-row">
                      <span className="view-detail-label">{t("tableColCreatedAt")}</span>
                      <span className="view-detail-value" style={{ fontSize: "0.86rem", fontWeight: 500 }}>
                        {formatDate(viewingCategory.created_at)}
                      </span>
                    </div>

                    {viewingCategory.updated_at && (
                      <div className="view-detail-row" style={{ borderBottom: "none" }}>
                        <span className="view-detail-label">{t("detailsUpdatedAt")}</span>
                        <span className="view-detail-value" style={{ fontSize: "0.86rem", fontWeight: 500 }}>
                          {formatDate(viewingCategory.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="table-state-box">
                  <h4 className="state-title">{t("noCategories")}</h4>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleCloseView}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          3. DELETE CONFIRMATION MODAL
          ==================================================== */}
      {isDeleteModalOpen && (
        <div
          className="vendo-modal-backdrop"
          onClick={handleCloseDelete}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="delete-category-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-red">
                  <FiTrash2 />
                </div>
                <span>{t("confirmDeleteTitle")}</span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseDelete}
                disabled={isDeleting}
                aria-label={t("close")}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vendo-modal-body">
              <div className="delete-confirm-body">
                <div className="delete-confirm-icon">
                  <FiTrash2 />
                </div>
                <h4 className="delete-confirm-title">{t("confirmDeleteTitle")}</h4>
                <p className="delete-confirm-text">{t("confirmDeleteMessage")}</p>
                {categoryToDelete && (
                  <div className="delete-target-badge">
                    <span>{categoryToDelete.name_ar}</span>
                    <span style={{ margin: "0 0.35rem", opacity: 0.5 }}>/</span>
                    <span dir="ltr">{categoryToDelete.name_en}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleCloseDelete}
                disabled={isDeleting}
              >
                {t("btnCancel")}
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="spin-animation" />
                    <span>{t("deleting")}</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    <span>{t("btnDelete")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardCategories;
