import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiBox,
  FiSliders,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiTrash2,
  FiRotateCcw,
  FiUploadCloud,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiTag,
  FiPlus,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { getProductDetails, updateProduct } from "@/services/productService";
import { getAllActiveCategories } from "@/services/categoryService";
import { getAllActiveColors, getAllActiveSizes } from "@/services/attributeService";
import "./Products.css";
import "./EditProduct.css";

const INITIAL_VARIANT = {
  id: undefined,
  color_id: "",
  size_id: "",
  quantity: "",
  status: true,
};

export function DashboardEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL, language } = useTranslation();

  // Navigation state product (if passed from table/details modal)
  const initialProductFromState = location.state?.product || null;

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(!initialProductFromState);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loaded Product Data
  const [product, setProduct] = useState(initialProductFromState);

  // Form Fields
  const [form, setForm] = useState({
    name_ar: initialProductFromState?.name_ar || "",
    name_en: initialProductFromState?.name_en || "",
    description_ar: initialProductFromState?.description_ar || "",
    description_en: initialProductFromState?.description_en || "",
    price: initialProductFromState?.price != null ? String(initialProductFromState.price) : "",
    old_price: initialProductFromState?.old_price != null ? String(initialProductFromState.old_price) : "",
    quantity: initialProductFromState?.quantity != null ? String(initialProductFromState.quantity) : "",
    status: initialProductFromState?.status !== false && initialProductFromState?.status !== 0 && initialProductFromState?.status !== "0",
  });

  // Categories Selection State
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    Array.isArray(initialProductFromState?.categories)
      ? initialProductFromState.categories.map((c) => Number(c.id))
      : []
  );
  const [categorySearch, setCategorySearch] = useState("");

  // Variant Mode Data (Colors, Sizes, Variants array)
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState(
    Array.isArray(initialProductFromState?.variants) && initialProductFromState.variants.length > 0
      ? initialProductFromState.variants.map((v) => ({
          id: v.id,
          color_id: v.color_id || v.color?.id || "",
          size_id: v.size_id || v.size?.id || "",
          quantity: v.quantity != null ? String(v.quantity) : "",
          status: v.status !== false && v.status !== 0 && v.status !== "0",
        }))
      : []
  );

  // Existing Images & Deletion Tracking
  const [existingImages, setExistingImages] = useState(
    Array.isArray(initialProductFromState?.images) ? initialProductFromState.images : []
  );
  const [deleteImageIds, setDeleteImageIds] = useState([]);

  // New Images Uploading
  const [newImageFiles, setNewImageFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // ----------------------------------------------------
  // Load Product & Dependencies Effect
  // ----------------------------------------------------
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        // 1. Fetch Product Data
        const productRes = await getProductDetails(id);
        const prod = productRes?.data;
        if (!prod) {
          throw new Error(t("productNotFound") || (isRTL ? "المنتج غير موجود" : "Product not found"));
        }

        if (ignore) return;

        setProduct(prod);

        // Pre-fill form values with current product data
        setForm({
          name_ar: prod.name_ar || "",
          name_en: prod.name_en || "",
          description_ar: prod.description_ar || "",
          description_en: prod.description_en || "",
          price: prod.price != null ? String(prod.price) : "",
          old_price: prod.old_price != null ? String(prod.old_price) : "",
          quantity: prod.quantity != null ? String(prod.quantity) : "",
          status: prod.status !== false && prod.status !== 0 && prod.status !== "0",
        });

        // Pre-fill categories
        if (Array.isArray(prod.categories)) {
          setSelectedCategories(prod.categories.map((c) => Number(c.id)));
        }

        // Pre-fill existing images
        if (Array.isArray(prod.images)) {
          setExistingImages(prod.images);
        }

        const isVariantType = Boolean(
          prod.has_variants === true || prod.has_variants === 1 || prod.has_variants === "1"
        );

        // Pre-fill variants if variant product
        if (isVariantType && Array.isArray(prod.variants)) {
          setVariants(
            prod.variants.map((v) => ({
              id: v.id,
              color_id: v.color_id || v.color?.id || "",
              size_id: v.size_id || v.size?.id || "",
              quantity: v.quantity != null ? String(v.quantity) : "",
              status: v.status !== false && v.status !== 0 && v.status !== "0",
            }))
          );
        }

        // 2. Fetch Options (Categories, and Colors/Sizes if variant product)
        const fetchPromises = [getAllActiveCategories()];
        if (isVariantType) {
          fetchPromises.push(getAllActiveColors());
          fetchPromises.push(getAllActiveSizes());
        }

        const [categoriesRes, colorsRes, sizesRes] = await Promise.all(fetchPromises);

        if (!ignore) {
          setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
          if (isVariantType) {
            setColors(Array.isArray(colorsRes) ? colorsRes : []);
            setSizes(Array.isArray(sizesRes) ? sizesRes : []);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Load product error:", err);
          if (err?.response?.status === 404) {
            setLoadError(t("productNotFound") || (isRTL ? "المنتج غير موجود أو تم حذفه." : "Product not found."));
          } else {
            setLoadError(
              err?.response?.data?.message ||
                t("failedToLoadProduct") ||
                (isRTL ? "تعذر تحميل بيانات المنتج. يرجى المحاولة مرة أخرى." : "Failed to load product details.")
            );
          }
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [id, t, isRTL]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      newImageFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [newImageFiles]);

  // Detect product type: variant or normal
  const isVariantProduct = Boolean(
    product &&
      (product.has_variants === true ||
        product.has_variants === 1 ||
        product.has_variants === "1")
  );

  // ----------------------------------------------------
  // Form Input Handlers
  // ----------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleStatusChange = (newStatus) => {
    setForm((prev) => ({ ...prev, status: newStatus }));
  };

  // ----------------------------------------------------
  // Categories Handler
  // ----------------------------------------------------
  const handleToggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      const idNum = Number(catId);
      const isSelected = prev.some((currId) => Number(currId) === idNum);
      if (isSelected) {
        return prev.filter((currId) => Number(currId) !== idNum);
      } else {
        return [...prev, idNum];
      }
    });

    if (fieldErrors.categories) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.categories;
        return next;
      });
    }
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter((c) => {
      const nameAr = (c.name_ar || "").toLowerCase();
      const nameEn = (c.name_en || "").toLowerCase();
      return nameAr.includes(q) || nameEn.includes(q);
    });
  }, [categories, categorySearch]);

  // ----------------------------------------------------
  // Existing Images Handlers (Mark for deletion & Undo)
  // ----------------------------------------------------
  const handleMarkImageForDeletion = (imageId) => {
    const idNum = Number(imageId);
    setDeleteImageIds((prev) => {
      if (!prev.includes(idNum)) {
        return [...prev, idNum];
      }
      return prev;
    });
  };

  const handleUndoImageDeletion = (imageId) => {
    const idNum = Number(imageId);
    setDeleteImageIds((prev) => prev.filter((id) => id !== idNum));
  };

  // ----------------------------------------------------
  // New Images Upload Handlers (Real File objects)
  // ----------------------------------------------------
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;
    const newItems = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(
          isRTL
            ? `الصيغة غير مدعومة للملف: ${file.name}. يدعم JPG, PNG, WEBP.`
            : `Unsupported format for file: ${file.name}. Only JPG, PNG, WEBP.`
        );
        return;
      }

      if (file.size > maxSizeBytes) {
        toast.error(
          isRTL
            ? `حجم الملف ${file.name} يتجاوز الحد الأقصى (5 ميجابايت).`
            : `File ${file.name} exceeds max size limit (5MB).`
        );
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        name: file.name,
        sizeKb: (file.size / 1024).toFixed(1),
      });
    });

    if (newItems.length > 0) {
      setNewImageFiles((prev) => [...prev, ...newItems]);
      if (fieldErrors.images) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.images;
          return next;
        });
      }
    }
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImageFiles((prev) => {
      const item = prev[indexToRemove];
      if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // ----------------------------------------------------
  // Variants Handlers (Variant Mode Only)
  // ----------------------------------------------------
  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { ...INITIAL_VARIANT }]);
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (fieldErrors.variants) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.variants;
        return next;
      });
    }
  };

  const handleToggleVariantStatus = (index) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status: !updated[index].status,
      };
      return updated;
    });
  };

  // Check if a specific variant row is duplicate
  const isVariantRowDuplicate = (row, rowIndex) => {
    if (!row.color_id || !row.size_id) return false;
    const currentKey = `${row.color_id}_${row.size_id}`;
    return variants.some(
      (v, idx) => idx !== rowIndex && `${v.color_id}_${v.size_id}` === currentKey
    );
  };

  // Check if duplicate color+size exists across variants list
  const checkDuplicateVariants = (vList) => {
    const seen = new Set();
    for (const v of vList) {
      if (v.color_id && v.size_id) {
        const key = `${v.color_id}_${v.size_id}`;
        if (seen.has(key)) return true;
        seen.add(key);
      }
    }
    return false;
  };

  const variantDuplicateError = useMemo(() => {
    if (!isVariantProduct) return null;
    if (checkDuplicateVariants(variants)) {
      return (
        t("duplicateVariant") ||
        (isRTL
          ? "لا يمكن تكرار نفس اللون والمقاس."
          : "The same color and size combination cannot be repeated.")
      );
    }
    return null;
  }, [isVariantProduct, variants, t, isRTL]);

  // ----------------------------------------------------
  // Validation
  // ----------------------------------------------------
  const validateForm = () => {
    const errs = {};

    if (!form.name_ar.trim()) {
      errs.name_ar = isRTL ? "اسم المنتج بالعربية مطلوب" : "Arabic product name is required";
    }
    if (!form.name_en.trim()) {
      errs.name_en = isRTL ? "اسم المنتج بالإنجليزية مطلوب" : "English product name is required";
    }
    if (!form.description_ar.trim()) {
      errs.description_ar = isRTL ? "الوصف بالعربية مطلوب" : "Arabic description is required";
    }
    if (!form.description_en.trim()) {
      errs.description_en = isRTL ? "الوصف بالإنجليزية مطلوب" : "English description is required";
    }

    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      errs.price = isRTL ? "السعر يجب أن يكون رقماً أكبر من 0" : "Price must be a number > 0";
    }

    if (form.old_price !== "" && form.old_price != null && String(form.old_price).trim() !== "") {
      const oldPriceNum = parseFloat(form.old_price);
      if (isNaN(oldPriceNum) || oldPriceNum <= priceNum) {
        errs.old_price = isRTL
          ? "السعر القديم يجب أن يكون أكبر من السعر الحالي"
          : "Old price must be greater than current price";
      }
    }

    // Inventory validation based on product type
    if (!isVariantProduct) {
      // Normal product inventory validation
      const qtyNum = parseInt(form.quantity, 10);
      if (
        form.quantity === "" ||
        form.quantity == null ||
        isNaN(qtyNum) ||
        qtyNum < 0 ||
        !/^\d+$/.test(String(form.quantity).trim())
      ) {
        errs.quantity = isRTL
          ? "الكمية يجب أن تكون رقماً صحيحاً أكبر من أو يساوي 0"
          : "Quantity must be an integer greater than or equal to 0";
      }
    } else {
      // Variant product inventory validation
      if (!variants || variants.length === 0) {
        errs.variants = isRTL ? "يجب توفر خيار واحد على الأقل للمنتج" : "At least one variant is required";
      } else {
        let hasIncomplete = false;
        let hasInvalidQty = false;

        variants.forEach((v) => {
          if (!v.color_id || !v.size_id) hasIncomplete = true;
          const vQty = parseInt(v.quantity, 10);
          if (
            v.quantity === "" ||
            v.quantity == null ||
            isNaN(vQty) ||
            vQty < 0 ||
            !/^\d+$/.test(String(v.quantity).trim())
          ) {
            hasInvalidQty = true;
          }
        });

        if (hasIncomplete) {
          errs.variants = isRTL
            ? "يرجى تحديد اللون والمقاس لجميع الخيارات"
            : "Please select color and size for all variants";
        } else if (hasInvalidQty) {
          errs.variants = isRTL
            ? "يجب أن تكون كمية كل خيار رقماً صحيحاً أكبر من أو يساوي 0"
            : "Quantity for each variant must be an integer greater than or equal to 0";
        } else if (checkDuplicateVariants(variants)) {
          errs.variants =
            t("duplicateVariant") ||
            (isRTL
              ? "لا يمكن تكرار نفس اللون والمقاس."
              : "The same color and size combination cannot be repeated.");
        }
      }
    }

    if (selectedCategories.length === 0) {
      errs.categories = isRTL
        ? "يرجى تحديد تصنيف واحد على الأقل للمنتج"
        : "Please select at least one category";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ----------------------------------------------------
  // Form Submission (POST /dashboard/update/products/{id})
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error(
        isRTL
          ? "يرجى مراجعة وتصحيح الأخطاء الموضحة في النموذج"
          : "Please correct the errors in the form"
      );
      return;
    }

    // Build multipart/form-data
    const formData = new FormData();
    formData.append("name_ar", form.name_ar.trim());
    formData.append("name_en", form.name_en.trim());
    formData.append("description_ar", form.description_ar.trim());
    formData.append("description_en", form.description_en.trim());
    formData.append("price", String(form.price).trim());

    // Send old_price only if provided
    if (form.old_price !== "" && form.old_price != null && String(form.old_price).trim() !== "") {
      formData.append("old_price", String(form.old_price).trim());
    }

    // Product status: 1 for active, 0 for inactive
    formData.append("status", form.status ? "1" : "0");

    // NORMAL PRODUCT VS VARIANT PRODUCT
    if (!isVariantProduct) {
      formData.append("has_variants", "0");
      formData.append("quantity", String(form.quantity).trim());
      // No variants, colors, or sizes appended!
    } else {
      formData.append("has_variants", "1");
      // Do NOT send global quantity for variant products!
      variants.forEach((v, index) => {
        // Send existing database variant ID if present (e.g. 29, 30, 31)
        if (v.id != null && v.id !== undefined && v.id !== "") {
          formData.append(`variants[${index}][id]`, String(v.id));
        }
        formData.append(`variants[${index}][color_id]`, String(v.color_id));
        formData.append(`variants[${index}][size_id]`, String(v.size_id));
        formData.append(`variants[${index}][quantity]`, String(v.quantity).trim());
        formData.append(`variants[${index}][status]`, v.status ? "1" : "0");
      });
    }

    // Selected categories: category_ids[]
    selectedCategories.forEach((catId) => {
      formData.append("category_ids[]", String(catId));
    });

    // Deleted existing image IDs: delete_image_ids[]
    deleteImageIds.forEach((imgId) => {
      formData.append("delete_image_ids[]", String(imgId));
    });

    // New uploaded image files: images[]
    newImageFiles.forEach((item) => {
      formData.append("images[]", item.file);
    });

    try {
      setIsSubmitting(true);
      await updateProduct(id, formData);

      toast.success(
        t("productUpdatedSuccess") ||
          (isRTL ? "تم تحديث المنتج بنجاح." : "Product updated successfully.")
      );

      // Clean up object URLs
      newImageFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      // Navigate back to products list with refresh instruction
      navigate("/dashboard/products", {
        state: { refresh: true, updatedProductId: id },
      });
    } catch (error) {
      console.error("Update product API error:", error);
      if (error.response) {
        const { status, data: resData } = error.response;

        if (status === 422 && resData?.errors) {
          const apiErrors = resData.errors;
          const mappedErrors = {};
          if (apiErrors.name_ar) mappedErrors.name_ar = apiErrors.name_ar[0];
          if (apiErrors.name_en) mappedErrors.name_en = apiErrors.name_en[0];
          if (apiErrors.description_ar) mappedErrors.description_ar = apiErrors.description_ar[0];
          if (apiErrors.description_en) mappedErrors.description_en = apiErrors.description_en[0];
          if (apiErrors.price) mappedErrors.price = apiErrors.price[0];
          if (apiErrors.old_price) mappedErrors.old_price = apiErrors.old_price[0];
          if (apiErrors.quantity) mappedErrors.quantity = apiErrors.quantity[0];
          if (apiErrors["category_ids"] || apiErrors["category_ids.0"]) {
            mappedErrors.categories =
              apiErrors["category_ids"]?.[0] || apiErrors["category_ids.0"]?.[0];
          }
          if (apiErrors["images"] || apiErrors["images.0"]) {
            mappedErrors.images = apiErrors["images"]?.[0] || apiErrors["images.0"]?.[0];
          }

          setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
          const firstMsg =
            Object.values(apiErrors)[0]?.[0] ||
            (isRTL ? "يرجى التحقق من صحة البيانات" : "Please check your inputs");
          toast.error(firstMsg);
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
              ? "ليس لديك صلاحية لتعديل المنتجات (مطلوب حساب مسؤول)"
              : "Access denied: Admin role required"
          );
          return;
        }

        if (status === 404) {
          toast.error(
            isRTL ? "المنتج غير موجود أو تم حذفه" : "Product not found or has been removed."
          );
          return;
        }

        toast.error(
          resData?.message ||
            (isRTL
              ? "تعذر تحديث المنتج، يرجى المحاولة لاحقاً."
              : "Failed to update product. Please try again later.")
        );
      } else {
        toast.error(
          isRTL
            ? "خطأ في الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت"
            : "Network error, please check your internet connection"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Render: Loading Skeleton
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="edit-product-view" dir={isRTL ? "rtl" : "ltr"}>
        <div className="edit-skeleton-wrap">
          <div className="skeleton-box" style={{ height: "90px" }} />
          <div className="skeleton-box" style={{ height: "240px" }} />
          <div className="skeleton-box" style={{ height: "160px" }} />
          <div className="skeleton-box" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Fetch Error
  // ----------------------------------------------------
  if (loadError) {
    return (
      <div className="edit-product-view" dir={isRTL ? "rtl" : "ltr"}>
        <div className="edit-product-header">
          <div className="edit-header-info">
            <div className="edit-header-icon" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
              <FiAlertCircle />
            </div>
            <div className="edit-header-title-wrap">
              <h1 className="edit-header-title">
                {t("editProduct") || (isRTL ? "تعديل المنتج" : "Edit Product")}
              </h1>
              <p className="edit-header-subtitle">#{id}</p>
            </div>
          </div>
          <Link to="/dashboard/products" className="btn-edit-back">
            {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
            <span>{t("backToProducts") || (isRTL ? "العودة للمنتجات" : "Back to Products")}</span>
          </Link>
        </div>

        <div className="edit-alert-banner error" role="alert">
          <div className="alert-content-wrap">
            <FiAlertCircle size={22} />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            className="btn-alert-action"
            onClick={() => window.location.reload()}
          >
            <FiRotateCcw />
            <span>{t("retry") || (isRTL ? "إعادة المحاولة" : "Retry")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-product-view" dir={isRTL ? "rtl" : "ltr"}>
      {/* Page Header */}
      <header className="edit-product-header">
        <div className="edit-header-info">
          <div className="edit-header-icon" style={isVariantProduct ? { backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" } : {}}>
            {isVariantProduct ? <FiSliders /> : <FiBox />}
          </div>
          <div className="edit-header-title-wrap">
            <div className="edit-header-title-row">
              <h1 className="edit-header-title">
                {isVariantProduct
                  ? t("editVariantProduct") || (isRTL ? "تعديل منتج بخيارات" : "Edit Variant Product")
                  : t("editNormalProduct") || (isRTL ? "تعديل منتج عادي" : "Edit Normal Product")}
              </h1>
              <span className="edit-product-id-badge">#{id}</span>
              <span className={`edit-mode-pill ${isVariantProduct ? "variant" : "normal"}`}>
                {isVariantProduct ? <FiSliders size={13} /> : <FiBox size={13} />}
                <span>
                  {isVariantProduct
                    ? isRTL
                      ? "منتج بخيارات (has_variants = 1)"
                      : "Product with Variants (has_variants = 1)"
                    : isRTL
                    ? "منتج عادي (has_variants = 0)"
                    : "Normal Product (has_variants = 0)"}
                </span>
              </span>
            </div>
            <p className="edit-header-subtitle">
              {isVariantProduct
                ? isRTL
                  ? "تعديل بيانات المنتج وخيارات الألوان والمقاسات ومخزون وحالة كل خيار بشكل مستقل."
                  : "Edit product details, color and size variants, and independent variant stocks."
                : isRTL
                ? "تعديل بيانات المنتج العادي والأسعار والمخزون المباشر والتصنيفات والصور."
                : "Edit normal product details, pricing, direct inventory quantity, categories, and images."}
            </p>
          </div>
        </div>

        <div className="edit-header-actions">
          <Link to="/dashboard/products" className="btn-edit-back">
            {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
            <span>{t("backToProducts") || (isRTL ? "العودة للمنتجات" : "Back to Products")}</span>
          </Link>
        </div>
      </header>

      {/* Safety Notice Banner */}
      <div className={`edit-alert-banner ${isVariantProduct ? "info" : "warning"}`}>
        <div className="alert-content-wrap">
          <FiAlertCircle size={20} />
          <span>
            {isVariantProduct
              ? isRTL
                ? "تنبيه الأمان: هذا المنتج يتضمن خيارات ألوان ومقاسات ومخزون مستقل. لا يمكن تحويله لمنتج عادي حفاظاً على سلامة المخزون."
                : "Safety Notice: This product contains variant inventory. It cannot be converted to normal mode to protect variant data."
              : isRTL
              ? "تنبيه الأمان: هذا المنتج عادي بدون خيارات، ويتم التحكم بمخزونه عبر حقل الكمية المباشرة."
              : "Safety Notice: This is a normal product without variants; its stock is controlled directly via the quantity field."}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* SECTION 1: Basic Information */}
          <section className="edit-section-card">
            <div className="edit-section-header">
              <div className="section-num-badge">1</div>
              <div className="section-text-wrap">
                <h3 className="section-head-title">
                  {t("productInformation") || (isRTL ? "المعلومات الأساسية" : "Basic Information")}
                </h3>
                <p className="section-head-desc">
                  {isRTL
                    ? "اسم ووصف المنتج باللغتين العربية والإنجليزية"
                    : "Product name and description in both Arabic and English"}
                </p>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="name_ar" className="form-label">
                  <span>{t("nameArLabel") || (isRTL ? "اسم المنتج بالعربية" : "Arabic Product Name")}</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="name_ar"
                  name="name_ar"
                  type="text"
                  dir="rtl"
                  className={`form-input ${fieldErrors.name_ar ? "has-error" : ""}`}
                  placeholder={isRTL ? "مثال: شيبسي بالجبنة الكبير" : "Arabic product name..."}
                  value={form.name_ar}
                  onChange={handleInputChange}
                  required
                />
                {fieldErrors.name_ar && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.name_ar}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="name_en" className="form-label">
                  <span>{t("nameEnLabel") || (isRTL ? "اسم المنتج بالإنجليزية" : "English Product Name")}</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="name_en"
                  name="name_en"
                  type="text"
                  dir="ltr"
                  className={`form-input ${fieldErrors.name_en ? "has-error" : ""}`}
                  placeholder="e.g. Large Cheese Chips"
                  value={form.name_en}
                  onChange={handleInputChange}
                  required
                />
                {fieldErrors.name_en && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.name_en}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="description_ar" className="form-label">
                  <span>{t("descArLabel") || (isRTL ? "الوصف بالعربية" : "Arabic Description")}</span>
                  <span className="required-star">*</span>
                </label>
                <textarea
                  id="description_ar"
                  name="description_ar"
                  dir="rtl"
                  rows={3}
                  className={`form-textarea ${fieldErrors.description_ar ? "has-error" : ""}`}
                  placeholder={isRTL ? "اكتب وصفاً مفصلاً للمنتج بالعربية..." : "Arabic description..."}
                  value={form.description_ar}
                  onChange={handleInputChange}
                  required
                />
                {fieldErrors.description_ar && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.description_ar}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description_en" className="form-label">
                  <span>{t("descEnLabel") || (isRTL ? "الوصف بالإنجليزية" : "English Description")}</span>
                  <span className="required-star">*</span>
                </label>
                <textarea
                  id="description_en"
                  name="description_en"
                  dir="ltr"
                  rows={3}
                  className={`form-textarea ${fieldErrors.description_en ? "has-error" : ""}`}
                  placeholder="English description..."
                  value={form.description_en}
                  onChange={handleInputChange}
                  required
                />
                {fieldErrors.description_en && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.description_en}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 2: Pricing */}
          <section className="edit-section-card">
            <div className="edit-section-header">
              <div className="section-num-badge">2</div>
              <div className="section-text-wrap">
                <h3 className="section-head-title">
                  {t("pricing") || (isRTL ? "التسعير" : "Pricing")}
                </h3>
                <p className="section-head-desc">
                  {isRTL
                    ? "السعر الحالي للمنتج بالجنيه المصري، والسعر القديم الاختياري في حال وجود تخفيض"
                    : "Current price in EGP, and optional old price for discount calculation"}
                </p>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="price" className="form-label">
                  <span>{t("price") || (isRTL ? "السعر الحالي (EGP)" : "Price (EGP)")}</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={isRTL ? "مثال: 50" : "e.g. 50"}
                  className={`form-input ${fieldErrors.price ? "has-error" : ""}`}
                  value={form.price}
                  onChange={handleInputChange}
                  required
                />
                {fieldErrors.price && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.price}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="old_price" className="form-label">
                  <span>
                    {t("oldPriceOptional") || (isRTL ? "السعر القديم (اختياري)" : "Old Price (Optional)")}
                  </span>
                </label>
                <input
                  id="old_price"
                  name="old_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={isRTL ? "مثال: 60" : "e.g. 60"}
                  className={`form-input ${fieldErrors.old_price ? "has-error" : ""}`}
                  value={form.old_price ?? ""}
                  onChange={handleInputChange}
                />
                {fieldErrors.old_price && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.old_price}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 3: Inventory (Normal) OR Variants (Variant Product) */}
          {!isVariantProduct ? (
            /* SECTION 3A: Normal Product Direct Inventory (has_variants = 0) */
            <section className="edit-section-card">
              <div className="edit-section-header">
                <div className="section-num-badge">3</div>
                <div className="section-text-wrap">
                  <h3 className="section-head-title">
                    {t("quantity") || (isRTL ? "المخزون والكمية المتوفرة" : "Inventory & Stock")}
                  </h3>
                  <p className="section-head-desc">
                    {isRTL
                      ? "حدد إجمالي القطع المتوفرة بالمخزن لهذا المنتج العادي (بدون ألوان أو مقاسات)."
                      : "Set the total available stock units for this normal product (no colors or sizes)."}
                  </p>
                </div>
              </div>

              <div className="inventory-normal-box">
                <div className="form-group" style={{ maxWidth: "340px" }}>
                  <label htmlFor="quantity" className="form-label">
                    <span>{t("stockQuantity") || (isRTL ? "الكمية بالمخزن" : "Stock Quantity")}</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={isRTL ? "مثال: 51" : "e.g. 51"}
                    className={`form-input ${fieldErrors.quantity ? "has-error" : ""}`}
                    value={form.quantity}
                    onChange={handleInputChange}
                    required
                  />
                  {fieldErrors.quantity && (
                    <div className="field-error">
                      <FiAlertCircle />
                      <span>{fieldErrors.quantity}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            /* SECTION 3B: Variant Product Matrix (has_variants = 1) */
            <section className="edit-section-card">
              <div className="edit-section-header">
                <div className="section-num-badge" style={{ backgroundColor: "#7c3aed" }}>
                  3
                </div>
                <div className="section-text-wrap">
                  <h3 className="section-head-title">
                    {t("variants") || (isRTL ? "خيارات المنتج (الألوان والمقاسات)" : "Product Variants")}
                  </h3>
                  <p className="section-head-desc">
                    {isRTL
                      ? "إدارة خيارات المنتج الحالية وتعديل الكميات والحالة مع الحفاظ التام على معرفات الخيارات (Variant IDs)."
                      : "Manage existing variants, adjust stock quantities and status, strictly preserving database Variant IDs."}
                  </p>
                </div>
              </div>

              {variantDuplicateError && (
                <div className="edit-alert-banner warning" role="alert">
                  <div className="alert-content-wrap">
                    <FiAlertCircle size={20} />
                    <span>{variantDuplicateError}</span>
                  </div>
                </div>
              )}

              {fieldErrors.variants && !variantDuplicateError && (
                <div className="field-error" style={{ marginBottom: "0.5rem" }}>
                  <FiAlertCircle />
                  <span>{fieldErrors.variants}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {variants.map((v, index) => {
                  const isDuplicate = isVariantRowDuplicate(v, index);
                  const isExisting = v.id != null;

                  return (
                    <div
                      key={`variant-row-${v.id || index}`}
                      className={`variant-edit-card ${!v.status ? "disabled-variant" : ""} ${
                        isDuplicate ? "has-duplicate-error" : ""
                      }`}
                    >
                      <div className="variant-card-top-bar">
                        <div className="variant-title-meta">
                          <span className="variant-seq-tag">
                            {t("variant") || (isRTL ? "خيار" : "Variant")} #{index + 1}
                          </span>
                          {isExisting ? (
                            <span className="variant-db-id-chip" title="Database Variant ID">
                              ID: #{v.id}
                            </span>
                          ) : (
                            <span className="variant-db-id-chip new-chip">
                              {isRTL ? "خيار جديد" : "New Variant"}
                            </span>
                          )}
                        </div>

                        <div className="variant-controls-actions">
                          {/* Toggle Status (1 / 0) */}
                          <button
                            type="button"
                            className={`btn-toggle-variant-status ${
                              v.status ? "is-active" : "is-inactive"
                            }`}
                            onClick={() => handleToggleVariantStatus(index)}
                            title={
                              v.status
                                ? isRTL
                                  ? "الخيار نشط - اضغط للتعطيل"
                                  : "Variant is active - Click to disable"
                                : isRTL
                                ? "الخيار معطل - اضغط للتفعيل"
                                : "Variant is disabled - Click to enable"
                            }
                          >
                            {v.status ? <FiCheck size={14} /> : <FiX size={14} />}
                            <span>
                              {v.status
                                ? t("statusActive") || (isRTL ? "نشط" : "Active")
                                : t("statusInactive") || (isRTL ? "معطل / غير نشط" : "Inactive")}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="variant-inputs-grid">
                        {/* Color Select */}
                        <div className="form-group">
                          <label htmlFor={`var-color-${index}`} className="form-label">
                            <span>{t("color") || (isRTL ? "اللون" : "Color")}</span>
                            <span className="required-star">*</span>
                          </label>
                          <select
                            id={`var-color-${index}`}
                            className={`form-select ${
                              !v.color_id && fieldErrors.variants ? "has-error" : ""
                            }`}
                            value={v.color_id}
                            onChange={(e) =>
                              handleVariantChange(index, "color_id", e.target.value)
                            }
                          >
                            <option value="">
                              {isRTL ? "-- اختر اللون --" : "-- Select Color --"}
                            </option>
                            {colors.map((c) => {
                              const cName =
                                language === "ar"
                                  ? c.name_ar || c.name_en
                                  : c.name_en || c.name_ar;
                              return (
                                <option key={`col-opt-${c.id}`} value={c.id}>
                                  {cName}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Size Select */}
                        <div className="form-group">
                          <label htmlFor={`var-size-${index}`} className="form-label">
                            <span>{t("size") || (isRTL ? "المقاس" : "Size")}</span>
                            <span className="required-star">*</span>
                          </label>
                          <select
                            id={`var-size-${index}`}
                            className={`form-select ${
                              !v.size_id && fieldErrors.variants ? "has-error" : ""
                            }`}
                            value={v.size_id}
                            onChange={(e) =>
                              handleVariantChange(index, "size_id", e.target.value)
                            }
                          >
                            <option value="">
                              {isRTL ? "-- اختر المقاس --" : "-- Select Size --"}
                            </option>
                            {sizes.map((s) => (
                              <option key={`sz-opt-${s.id}`} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Input */}
                        <div className="form-group">
                          <label htmlFor={`var-qty-${index}`} className="form-label">
                            <span>{t("variantQuantity") || (isRTL ? "الكمية" : "Quantity")}</span>
                            <span className="required-star">*</span>
                          </label>
                          <input
                            id={`var-qty-${index}`}
                            type="number"
                            min="0"
                            step="1"
                            placeholder={isRTL ? "مثال: 20" : "e.g. 20"}
                            className={`form-input ${
                              (v.quantity === "" || parseInt(v.quantity, 10) < 0) &&
                              fieldErrors.variants
                                ? "has-error"
                                : ""
                            }`}
                            value={v.quantity}
                            onChange={(e) =>
                              handleVariantChange(index, "quantity", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="btn-add-variant"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <FiPlus />
                  <span>{t("addVariant") || (isRTL ? "إضافة خيار جديد" : "Add Variant")}</span>
                </button>
              </div>
            </section>
          )}

          {/* SECTION 4: Status */}
          <section className="edit-section-card">
            <div className="edit-section-header">
              <div className="section-num-badge">4</div>
              <div className="section-text-wrap">
                <h3 className="section-head-title">
                  {t("productStatus") || (isRTL ? "حالة ظهور المنتج" : "Product Visibility Status")}
                </h3>
                <p className="section-head-desc">
                  {isRTL
                    ? "التحكم في تفعيل أو إيقاف ظهور المنتج في المتجر الرئيسي"
                    : "Control whether the product is actively visible and purchasable in the store"}
                </p>
              </div>
            </div>

            <div className="status-options-grid" role="radiogroup" aria-label="Product Status">
              {/* Active Option: status = 1 */}
              <button
                type="button"
                role="radio"
                aria-checked={form.status === true}
                className={`status-option-card ${form.status === true ? "active-selected" : ""}`}
                onClick={() => handleStatusChange(true)}
              >
                <div className="status-indicator-dot" />
                <div className="status-option-info">
                  <span className="status-option-title">
                    {isRTL ? "نشط (Active)" : "Active"}
                  </span>
                  <span className="status-option-sub">
                    {isRTL
                      ? "المنتج متاح ويظهر للعملاء في المتجر"
                      : "Visible and purchasable in store"}
                  </span>
                </div>
              </button>

              {/* Inactive Option: status = 0 */}
              <button
                type="button"
                role="radio"
                aria-checked={form.status === false}
                className={`status-option-card ${form.status === false ? "inactive-selected" : ""}`}
                onClick={() => handleStatusChange(false)}
              >
                <div className="status-indicator-dot" />
                <div className="status-option-info">
                  <span className="status-option-title">
                    {isRTL ? "غير نشط (Inactive)" : "Inactive"}
                  </span>
                  <span className="status-option-sub">
                    {isRTL
                      ? "المنتج محجوب مؤقتاً عن واجهة المتجر"
                      : "Temporarily hidden from storefront"}
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* SECTION 5: Categories */}
          <section className="edit-section-card">
            <div className="edit-section-header">
              <div className="section-num-badge">5</div>
              <div className="section-text-wrap">
                <h3 className="section-head-title">
                  {t("categories") || (isRTL ? "التصنيفات" : "Categories")}
                </h3>
                <p className="section-head-desc">
                  {isRTL
                    ? "حدد التصنيفات التي ينتمي إليها المنتج في المتجر"
                    : "Select the categories that this product belongs to"}
                </p>
              </div>
            </div>

            <div className="categories-selector-box">
              {categories.length > 6 && (
                <input
                  type="text"
                  className="category-search-input"
                  placeholder={isRTL ? "ابحث في التصنيفات..." : "Filter categories..."}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              )}

              <div className="categories-pills-grid" role="group" aria-label="Product Categories">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => {
                    const isSelected = selectedCategories.some(
                      (idNum) => Number(idNum) === Number(cat.id)
                    );
                    const catName =
                      language === "ar"
                        ? cat.name_ar || cat.name_en
                        : cat.name_en || cat.name_ar;

                    return (
                      <button
                        key={`cat-pill-${cat.id}`}
                        type="button"
                        className={`category-select-pill ${isSelected ? "active" : ""}`}
                        onClick={() => handleToggleCategory(cat.id)}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? (
                          <FiCheck className="pill-check-icon" />
                        ) : (
                          <FiTag className="pill-check-icon" />
                        )}
                        <span>{catName}</span>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: "0.5rem", color: "var(--vendo-gray-muted)", fontSize: "0.85rem" }}>
                    {isRTL ? "لا توجد تصنيفات مطابقة للبحث" : "No matching categories found"}
                  </div>
                )}
              </div>

              {fieldErrors.categories && (
                <div className="field-error">
                  <FiAlertCircle />
                  <span>{fieldErrors.categories}</span>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: Images (Existing with Undo & New with File uploads) */}
          <section className="edit-section-card">
            <div className="edit-section-header">
              <div className="section-num-badge">6</div>
              <div className="section-text-wrap">
                <h3 className="section-head-title">
                  {t("images") || (isRTL ? "صور المنتج" : "Product Images")}
                </h3>
                <p className="section-head-desc">
                  {isRTL
                    ? "إدارة الصور الحالية للمنتج (حذف وتراجع) ورفع صور جديدة (JPG, PNG, WEBP حتى 5MB)."
                    : "Manage existing product images (delete and undo) and upload new images."}
                </p>
              </div>
            </div>

            {/* Existing Images Group */}
            <div className="existing-images-section">
              <div className="existing-images-title">
                <FiPackage size={16} />
                <span>
                  {t("existingImages") || (isRTL ? "الصور الحالية للمنتج" : "Existing Product Images")}
                  {" ("}
                  {existingImages.length}
                  {")"}
                </span>
              </div>

              {existingImages.length > 0 ? (
                <div className="existing-images-grid">
                  {existingImages.map((img) => {
                    const isMarkedDeleted = deleteImageIds.includes(Number(img.id));

                    return (
                      <div
                        key={`existing-img-${img.id}`}
                        className={`existing-img-card ${isMarkedDeleted ? "marked-deleted" : ""}`}
                      >
                        <div className="existing-img-thumb">
                          <img
                            src={img.image}
                            alt={`Product image #${img.id}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <span className="existing-img-badge-id">ID: #{img.id}</span>

                          {isMarkedDeleted && (
                            <div className="existing-img-overlay-deleted">
                              <FiTrash2 size={24} />
                              <span>{t("markedForDeletion") || (isRTL ? "محددة للحذف" : "Marked for Deletion")}</span>
                            </div>
                          )}
                        </div>

                        <div className="existing-img-footer">
                          {isMarkedDeleted ? (
                            <button
                              type="button"
                              className="btn-existing-undo"
                              onClick={() => handleUndoImageDeletion(img.id)}
                              title={t("undo") || (isRTL ? "تراجع عن الحذف" : "Undo Deletion")}
                            >
                              <FiRotateCcw size={14} />
                              <span>{t("undo") || (isRTL ? "تراجع" : "Undo")}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-existing-remove"
                              onClick={() => handleMarkImageForDeletion(img.id)}
                              title={t("deleteImage") || (isRTL ? "حذف الصورة" : "Remove Image")}
                            >
                              <FiTrash2 size={14} />
                              <span>{t("deleteImage") || (isRTL ? "حذف" : "Remove")}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-existing-images-box">
                  {t("noExistingImages") || (isRTL ? "لا توجد صور حالية" : "No existing images")}
                </div>
              )}
            </div>

            {/* New Images Upload Section */}
            <div style={{ marginTop: "1rem" }}>
              <div className="existing-images-title" style={{ marginBottom: "0.75rem" }}>
                <FiUploadCloud size={16} />
                <span>{t("newImages") || (isRTL ? "إضافة صور جديدة" : "Add New Images")}</span>
              </div>

              <div className="images-dropzone-wrap">
                <div
                  className={`images-dropzone ${isDragOver ? "drag-over" : ""} ${
                    fieldErrors.images ? "has-error" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden-file-input"
                    onChange={handleFileInputChange}
                  />
                  <div className="dropzone-icon-box" aria-hidden="true">
                    <FiUploadCloud />
                  </div>
                  <div className="dropzone-main-text">
                    {t("uploadImagesPrompt") ||
                      (isRTL
                        ? "اضغط لاختيار صور جديدة أو اسحبها هنا"
                        : "Click to upload new images or drag & drop")}
                  </div>
                  <div className="dropzone-hint-text">
                    {isRTL
                      ? "يدعم صيغ JPG, PNG, WEBP (حتى 5MB لكل صورة)"
                      : "Supports JPG, PNG, WEBP (Up to 5MB each)"}
                  </div>
                </div>

                {fieldErrors.images && (
                  <div className="field-error">
                    <FiAlertCircle />
                    <span>{fieldErrors.images}</span>
                  </div>
                )}

                {/* Previews of newly selected files */}
                {newImageFiles.length > 0 && (
                  <div className="image-previews-grid" style={{ marginTop: "1rem" }}>
                    {newImageFiles.map((item, index) => (
                      <div key={item.id} className="image-preview-card">
                        <div className="preview-img-container">
                          <img src={item.previewUrl} alt={`New upload ${index + 1}`} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNewImage(index);
                            }}
                            className="btn-remove-image"
                            title={isRTL ? "إلغاء الصورة" : "Cancel image"}
                            aria-label={isRTL ? "إلغاء الصورة" : "Cancel image"}
                          >
                            <FiX />
                          </button>
                        </div>
                        <div className="preview-meta">
                          <span className="preview-name" title={item.name}>
                            {item.name}
                          </span>
                          <span className="preview-size">{item.sizeKb} KB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Sticky Bottom Actions Bar */}
          <div className="edit-form-bottom-actions">
            <div>
              <span style={{ fontSize: "0.88rem", color: "var(--vendo-gray-muted)" }}>
                {isRTL ? `جاري التعديل على المنتج #${id}` : `Editing product #${id}`}
              </span>
            </div>

            <div className="bottom-action-buttons">
              <Link to="/dashboard/products" className="btn-cancel-edit">
                {t("cancel") || (isRTL ? "إلغاء" : "Cancel")}
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-submit-edit"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="spin-animation" />
                    <span>
                      {t("savingChanges") || (isRTL ? "جاري حفظ التعديلات..." : "Saving Changes...")}
                    </span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>
                      {t("saveChanges") || (isRTL ? "حفظ التعديلات" : "Save Changes")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default DashboardEditProduct;
