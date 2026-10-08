import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
  FiSliders,
  FiTag,
  FiCheckCircle,
  FiBox,
  FiEye,
  FiPercent,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiArrowRight,
  FiArrowLeft,
  FiLoader,
  FiEdit2,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import {
  getDashboardProducts,
  getDashboardOffers,
  createProduct,
  deleteProduct,
} from "@/services/productService";
import { getAllActiveColors, getAllActiveSizes } from "@/services/attributeService";
import { getAllActiveCategories } from "@/services/categoryService";
import "./Products.css";

const INITIAL_VARIANT = {
  color_id: "",
  size_id: "",
  quantity: "",
};

const INITIAL_FORM = {
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  price: "",
  old_price: "",
  quantity: "",
};

// Helper: Format date for display
const formatDisplayDate = (dateStr, isRTL) => {
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

export function DashboardProducts() {
  const { t, isRTL, language } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const location = useLocation();
  const navigate = useNavigate();

  // Detect whether we are on the Create page (/dashboard/products/create)
  const isCreateRoute = location.pathname.endsWith("/create");

  // ====================================================
  // LIST VIEW STATE (All Products vs Offers)
  // ====================================================
  const [activeTab, setActiveTab] = useState("all"); // "all" | "offers"
  const [searchQuery, setSearchQuery] = useState("");

  // All Products State
  const [allProducts, setAllProducts] = useState([]);
  const [pageAll, setPageAll] = useState(1);
  const [paginationAll, setPaginationAll] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState("");

  // Offers State
  const [offerProducts, setOfferProducts] = useState([]);
  const [pageOffers, setPageOffers] = useState(1);
  const [paginationOffers, setPaginationOffers] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [errorOffers, setErrorOffers] = useState("");

  // Refresh trigger counter to manually re-fetch data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Product Details Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);

  // Delete Product Confirmation State
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ====================================================
  // CREATE FORM STATE
  // ====================================================
  const [productType, setProductType] = useState("normal"); // "normal" | "variant"
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [variants, setVariants] = useState([{ ...INITIAL_VARIANT }]);

  // Categories Selection State
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");

  // Colors & Sizes State
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  // Data Loading & Errors for Create Mode
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsLoadError, setOptionsLoadError] = useState("");

  // Image Upload State
  const [imageFiles, setImageFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: Calculate total active stock for a product
  const calculateProductStock = useCallback((product) => {
    if (!product) return 0;
    if (!product.has_variants) {
      return parseInt(product.quantity, 10) || 0;
    }
    const variantsList = Array.isArray(product.variants) ? product.variants : [];
    return variantsList
      .filter((v) => v.status === true || v.status === 1 || v.status === undefined)
      .reduce((sum, v) => sum + (parseInt(v.quantity, 10) || 0), 0);
  }, []);

  // ====================================================
  // DATA FETCHING EFFECT
  // ====================================================
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!isCreateRoute) {
        if (activeTab === "all") {
          try {
            setLoadingAll(true);
            setErrorAll("");
            const response = await getDashboardProducts(pageAll);
            if (!ignore) {
              if (response && response.data) {
                setAllProducts(Array.isArray(response.data) ? response.data : []);
                if (response.pagination) {
                  setPaginationAll(response.pagination);
                }
              } else {
                setAllProducts([]);
              }
            }
          } catch (err) {
            if (!ignore) {
              console.error("Fetch all products error:", err);
              setErrorAll(
                err.response?.data?.message ||
                  t("failedToLoadProducts") ||
                  "تعذر تحميل المنتجات، يرجى المحاولة مرة أخرى."
              );
            }
          } finally {
            if (!ignore) setLoadingAll(false);
          }
        } else {
          try {
            setLoadingOffers(true);
            setErrorOffers("");
            const response = await getDashboardOffers(pageOffers);
            if (!ignore) {
              if (response && response.data) {
                setOfferProducts(Array.isArray(response.data) ? response.data : []);
                if (response.pagination) {
                  setPaginationOffers(response.pagination);
                }
              } else {
                setOfferProducts([]);
              }
            }
          } catch (err) {
            if (!ignore) {
              console.error("Fetch offers error:", err);
              setErrorOffers(
                err.response?.data?.message ||
                  t("failedToLoadOffers") ||
                  "تعذر تحميل العروض، يرجى المحاولة مرة أخرى."
              );
            }
          } finally {
            if (!ignore) setLoadingOffers(false);
          }
        }
      } else {
        // Fetch Options for Create Product Mode
        try {
          setIsLoadingOptions(true);
          setOptionsLoadError("");
          const [fetchedColors, fetchedSizes, fetchedCategories] = await Promise.all([
            getAllActiveColors(),
            getAllActiveSizes(),
            getAllActiveCategories(),
          ]);
          if (!ignore) {
            setColors(Array.isArray(fetchedColors) ? fetchedColors : []);
            setSizes(Array.isArray(fetchedSizes) ? fetchedSizes : []);
            setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
          }
        } catch (err) {
          if (!ignore) {
            console.error("Error loading product options:", err);
            setOptionsLoadError(
              t("errorLoadingOptions") || "تعذر تحميل الخيارات الأساسية (الألوان، المقاسات، والتصنيفات)."
            );
          }
        } finally {
          if (!ignore) setIsLoadingOptions(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [activeTab, pageAll, pageOffers, isCreateRoute, refreshTrigger, location.state, t]);

  // Tab switch handler: resets page to 1
  const handleTabSwitch = (tabKey) => {
    if (tabKey === activeTab) return;
    setActiveTab(tabKey);
    setSearchQuery("");
    if (tabKey === "all") {
      setPageAll(1);
    } else {
      setPageOffers(1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pagination Change Handlers
  const handlePageChange = (newPage) => {
    if (activeTab === "all") {
      if (newPage >= 1 && newPage <= paginationAll.last_page && !loadingAll) {
        setPageAll(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (newPage >= 1 && newPage <= paginationOffers.last_page && !loadingOffers) {
        setPageOffers(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imageFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [imageFiles]);

  // ====================================================
  // FILTERED CURRENT PRODUCTS (Search Filter)
  // ====================================================
  const currentDisplayedProducts = useMemo(() => {
    const list = activeTab === "all" ? allProducts : offerProducts;
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((p) => {
      const nameAr = (p.name_ar || "").toLowerCase();
      const nameEn = (p.name_en || "").toLowerCase();
      const idMatch = String(p.id).includes(q);
      const categoryMatch = (p.categories || []).some(
        (c) =>
          (c.name_ar || "").toLowerCase().includes(q) ||
          (c.name_en || "").toLowerCase().includes(q)
      );
      return nameAr.includes(q) || nameEn.includes(q) || idMatch || categoryMatch;
    });
  }, [activeTab, allProducts, offerProducts, searchQuery]);

  const currentPagination = activeTab === "all" ? paginationAll : paginationOffers;
  const currentLoading = activeTab === "all" ? loadingAll : loadingOffers;
  const currentError = activeTab === "all" ? errorAll : errorOffers;

  // Keyboard accessibility: close delete modal on Escape
  useEffect(() => {
    if (!productToDelete) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isDeletingProduct) {
        setProductToDelete(null);
        setDeleteError("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productToDelete, isDeletingProduct]);

  // Handle Confirm Product Deletion
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete || isDeletingProduct) return;

    if (!isAdmin) {
      toast.error(
        t("noPermissionDeleteProduct") ||
          (isRTL ? "ليس لديك صلاحية لحذف المنتج." : "You do not have permission to delete this product.")
      );
      return;
    }

    try {
      setIsDeletingProduct(true);
      setDeleteError("");

      await deleteProduct(productToDelete.id);

      toast.success(
        t("productDeletedSuccess") ||
          (isRTL ? "تم حذف المنتج بنجاح." : "Product deleted successfully.")
      );

      // Handle server-side pagination and local state update
      if (activeTab === "all") {
        const remaining = allProducts.filter((p) => p.id !== productToDelete.id);
        setAllProducts(remaining);
        setOfferProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

        // If deletion causes current page to become empty and currentPage > 1, go to previous page
        if (remaining.length === 0 && pageAll > 1) {
          setPageAll((prev) => prev - 1);
        } else {
          setRefreshTrigger((prev) => prev + 1);
        }
      } else {
        const remaining = offerProducts.filter((p) => p.id !== productToDelete.id);
        setOfferProducts(remaining);
        setAllProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

        // If deletion causes current page to become empty and currentPage > 1, go to previous page
        if (remaining.length === 0 && pageOffers > 1) {
          setPageOffers((prev) => prev - 1);
        } else {
          setRefreshTrigger((prev) => prev + 1);
        }
      }

      setProductToDelete(null);
    } catch (err) {
      console.error("Delete product error:", err);
      const status = err.response?.status;
      let errorMsg;

      if (status === 401) {
        errorMsg = isRTL ? "انتهت الجلسة، يرجى تسجيل الدخول مجدداً." : "Session expired. Please log in again.";
      } else if (status === 403) {
        errorMsg =
          t("noPermissionDeleteProduct") ||
          (isRTL ? "ليس لديك صلاحية لحذف المنتج." : "You do not have permission to delete this product.");
      } else if (status === 404) {
        errorMsg =
          t("productNotFound") ||
          (isRTL ? "المنتج غير موجود." : "Product not found.");
      } else if (status === 422) {
        errorMsg =
          err.response?.data?.message ||
          (isRTL ? "بيانات غير صالحة." : "Validation error.");
      } else if (!err.response) {
        errorMsg =
          t("unableToConnectToServer") ||
          (isRTL ? "تعذر الاتصال بالخادم." : "Unable to connect to the server.");
      } else {
        errorMsg =
          t("failedToDeleteProduct") ||
          err.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء حذف المنتج، يرجى المحاولة مرة أخرى." : "Failed to delete product. Please try again.");
      }

      setDeleteError(errorMsg);
      toast.error(errorMsg);
      // Failure behavior: keep product in UI and keep modal open for retry
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // ====================================================
  // CREATE PRODUCT HANDLERS & COMPUTATIONS
  // ====================================================
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

  const discountCalculation = useMemo(() => {
    const currentPrice = parseFloat(form.price);
    const oldPrice = parseFloat(form.old_price);

    if (!isNaN(currentPrice) && !isNaN(oldPrice) && oldPrice > currentPrice && currentPrice > 0) {
      const percentage = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
      const savings = (oldPrice - currentPrice).toFixed(2);
      return { percentage, savings, isValid: true };
    }
    return { percentage: 0, savings: 0, isValid: false };
  }, [form.price, form.old_price]);

  const checkDuplicateVariants = useCallback((list) => {
    const seen = new Set();
    let hasDuplicate = false;

    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      if (v.color_id && v.size_id) {
        const key = `${v.color_id}_${v.size_id}`;
        if (seen.has(key)) {
          hasDuplicate = true;
          break;
        }
        seen.add(key);
      }
    }
    return hasDuplicate;
  }, []);

  // Computed duplicate error for variants
  const variantDuplicateError = useMemo(() => {
    if (productType !== "variant") return "";
    return checkDuplicateVariants(variants)
      ? isRTL
        ? "لا يمكن تكرار نفس اللون والمقاس."
        : "The same color and size combination cannot be repeated."
      : "";
  }, [productType, variants, isRTL, checkDuplicateVariants]);

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { ...INITIAL_VARIANT }]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 1) {
      toast.error(
        isRTL
          ? "يجب أن يحتوي المنتج على خيار واحد على الأقل"
          : "Product must have at least one variant"
      );
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
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

  const isVariantRowDuplicate = (row, rowIndex) => {
    if (!row.color_id || !row.size_id) return false;
    const currentKey = `${row.color_id}_${row.size_id}`;
    return variants.some(
      (v, idx) => idx !== rowIndex && `${v.color_id}_${v.size_id}` === currentKey
    );
  };

  const totalVariantStock = useMemo(() => {
    return variants.reduce((sum, v) => {
      const q = parseInt(v.quantity, 10);
      return !isNaN(q) && q > 0 ? sum + q : sum;
    }, 0);
  }, [variants]);

  const handleToggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      const idNum = Number(catId);
      const isSelected = prev.some((id) => Number(id) === idNum);
      if (isSelected) {
        return prev.filter((id) => Number(id) !== idNum);
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
      setImageFiles((prev) => [...prev, ...newItems]);
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

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles((prev) => {
      const item = prev[indexToRemove];
      if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleResetForm = () => {
    if (
      form.name_ar ||
      form.name_en ||
      form.price ||
      imageFiles.length > 0 ||
      selectedCategories.length > 0
    ) {
      const confirmMsg =
        t("confirmResetForm") || "هل أنت متأكد من رغبتك في مسح كافة البيانات المدخلة؟";
      if (!window.confirm(confirmMsg)) return;
    }

    imageFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });

    setForm(INITIAL_FORM);
    setFieldErrors({});
    setImageFiles([]);
    setSelectedCategories([]);
    setVariants([{ ...INITIAL_VARIANT }]);
    setProductType("normal");
  };

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
      errs.price = t("priceMustBePositive") || "السعر يجب أن يكون أكبر من 0";
    }

    if (form.old_price && form.old_price.trim() !== "") {
      const oldPriceNum = parseFloat(form.old_price);
      if (isNaN(oldPriceNum) || oldPriceNum < priceNum) {
        errs.old_price =
          t("oldPriceMustBeGreater") ||
          "السعر القديم يجب أن يكون أكبر من أو يساوي السعر الحالي";
      }
    }

    if (productType === "normal") {
      const qtyNum = parseInt(form.quantity, 10);
      if (
        !form.quantity ||
        isNaN(qtyNum) ||
        qtyNum <= 0 ||
        !/^\d+$/.test(String(form.quantity).trim())
      ) {
        errs.quantity =
          t("quantityMustBePositive") || "الكمية يجب أن تكون رقماً صحيحاً أكبر من 0";
      }
    } else {
      if (!variants || variants.length === 0) {
        errs.variants = t("atLeastOneVariant") || "يجب إضافة خيار واحد على الأقل للمنتج";
      } else {
        let hasIncomplete = false;
        let hasInvalidQty = false;

        variants.forEach((v) => {
          if (!v.color_id || !v.size_id) hasIncomplete = true;
          const vQty = parseInt(v.quantity, 10);
          if (!v.quantity || isNaN(vQty) || vQty <= 0 || !/^\d+$/.test(String(v.quantity).trim())) {
            hasInvalidQty = true;
          }
        });

        if (hasIncomplete) {
          errs.variants =
            isRTL
              ? "يرجى تحديد اللون والمقاس لجميع الخيارات"
              : "Please select color and size for all variants";
        } else if (hasInvalidQty) {
          errs.variants =
            isRTL
              ? "يجب أن تكون كمية كل خيار رقماً صحيحاً أكبر من 0"
              : "Quantity for each variant must be an integer greater than 0";
        } else if (checkDuplicateVariants(variants)) {
          errs.variants =
            isRTL
              ? "لا يمكن تكرار نفس اللون والمقاس."
              : "The same color and size combination cannot be repeated.";
        }
      }
    }

    if (imageFiles.length === 0) {
      errs.images = t("atLeastOneImage") || "يرجى اختيار صورة واحدة على الأقل للمنتج";
    }

    if (selectedCategories.length === 0) {
      errs.categories = t("atLeastOneCategory") || "يرجى تحديد تصنيف واحد على الأقل للمنتج";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitProduct = async (e) => {
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

    const formData = new FormData();
    formData.append("name_ar", form.name_ar.trim());
    formData.append("name_en", form.name_en.trim());
    formData.append("description_ar", form.description_ar.trim());
    formData.append("description_en", form.description_en.trim());

    if (form.old_price && form.old_price.trim() !== "") {
      formData.append("old_price", form.old_price.trim());
    }
    formData.append("price", form.price.trim());

    if (productType === "normal") {
      formData.append("has_variants", "0");
      formData.append("quantity", form.quantity.trim());
    } else {
      formData.append("has_variants", "1");
      variants.forEach((v, index) => {
        formData.append(`variants[${index}][color_id]`, String(v.color_id));
        formData.append(`variants[${index}][size_id]`, String(v.size_id));
        formData.append(`variants[${index}][quantity]`, String(v.quantity).trim());
      });
    }

    imageFiles.forEach((item) => {
      formData.append("images[]", item.file);
    });

    selectedCategories.forEach((catId) => {
      formData.append("category_ids[]", String(catId));
    });

    try {
      setIsSubmitting(true);
      await createProduct(formData);
      toast.success(t("productCreatedSuccess") || "تم إنشاء المنتج بنجاح!");

      // Cleanup
      imageFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setForm(INITIAL_FORM);
      setFieldErrors({});
      setImageFiles([]);
      setSelectedCategories([]);
      setVariants([{ ...INITIAL_VARIANT }]);
      setProductType("normal");

      // Navigate back to products list & refresh
      navigate("/dashboard/products");
      setActiveTab("all");
      setPageAll(1);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Create product API error:", error);
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
          if (apiErrors["images"] || apiErrors["images.0"]) {
            mappedErrors.images = apiErrors["images"]?.[0] || apiErrors["images.0"]?.[0];
          }
          if (apiErrors["category_ids"] || apiErrors["category_ids.0"]) {
            mappedErrors.categories =
              apiErrors["category_ids"]?.[0] || apiErrors["category_ids.0"]?.[0];
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
              ? "ليس لديك صلاحية لإضافة منتجات (مطلوب حساب مسؤول)"
              : "Access denied: Admin role required"
          );
          return;
        }

        if (resData?.message) {
          toast.error(resData.message);
          return;
        }
      }

      toast.error(
        isRTL
          ? "تعذر إنشاء المنتج، يرجى المحاولة مرة أخرى أو فحص الاتصال"
          : "Failed to create product. Please check your connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================================================
  // RENDER: CREATE PRODUCT VIEW
  // ====================================================
  if (isCreateRoute) {
    return (
      <div className="products-dashboard-view">
        {/* Create Header with Back Button */}
        <header className="products-page-header">
          <div className="products-header-info">
            <div className="products-header-icon" aria-hidden="true">
              <FiPackage />
            </div>
            <div>
              <h2 className="products-header-title">
                {t("createNewProduct") || (isRTL ? "إنشاء منتج جديد" : "Create New Product")}
              </h2>
              <p className="products-header-subtitle">
                {t("productManagementSubtitle") ||
                  (isRTL
                    ? "إضافة منتج جديد للكتالوج سواء كان منتجاً عادياً أو بخيارات ألوان ومقاسات."
                    : "Add a new product to catalog (Normal product or with variants).")}
              </p>
            </div>
          </div>

          <div className="products-header-actions">
            <Link to="/dashboard/products" className="btn-header-secondary">
              {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
              <span>{t("btnBackToProducts") || (isRTL ? "العودة للمنتجات" : "Back to Products")}</span>
            </Link>

            <button
              type="button"
              onClick={handleResetForm}
              className="btn-form-reset"
              disabled={isSubmitting}
            >
              <FiRefreshCw />
              <span>{t("clearForm") || (isRTL ? "إعادة تعيين" : "Reset Form")}</span>
            </button>
          </div>
        </header>

        {/* Options Loading State */}
        {isLoadingOptions && (
          <div className="product-options-loading-box" role="status" aria-live="polite">
            <FiRefreshCw className="spin-animation" size={18} />
            <span>
              {isRTL
                ? "جاري تحميل التصنيفات والألوان والمقاسات النشطة من الخادم..."
                : "Loading active categories, colors, and sizes from the server..."}
            </span>
          </div>
        )}

        {/* Options Loading Warning */}
        {optionsLoadError && (
          <div className="products-alert-box" role="alert">
            <div className="alert-message-content">
              <FiAlertCircle size={20} />
              <span>{optionsLoadError}</span>
            </div>
            <button
              type="button"
              className="btn-alert-retry"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
            >
              <FiRefreshCw />
              <span>{t("btnRetry") || "إعادة المحاولة"}</span>
            </button>
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleSubmitProduct} className="product-form-layout" noValidate>
          {/* SECTION 1: Product Type */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">1</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {t("productType") || (isRTL ? "نوع المنتج" : "Product Type")}
                </h3>
                <p className="section-desc">
                  {isRTL
                    ? "اختر ما إذا كان المنتج بمخزون مباشر بسيط أو بخيارات ألوان ومقاسات"
                    : "Choose whether the product has direct stock or color/size variants"}
                </p>
              </div>
            </div>

            <div className="product-type-grid" role="radiogroup" aria-label="Product Type Selection">
              <button
                type="button"
                role="radio"
                aria-checked={productType === "normal"}
                className={`product-type-card ${productType === "normal" ? "selected" : ""}`}
                onClick={() => setProductType("normal")}
              >
                <div className="type-card-radio">
                  <div className="radio-indicator">
                    {productType === "normal" && <div className="radio-inner-dot" />}
                  </div>
                </div>
                <div className="type-card-content">
                  <div className="type-card-title-row">
                    <span className="type-card-title">
                      {t("normalProduct") || (isRTL ? "منتج عادي" : "Normal Product")}
                    </span>
                    <span className="type-card-badge">has_variants = 0</span>
                  </div>
                  <p className="type-card-desc">
                    {t("normalProductDesc") ||
                      (isRTL
                        ? "منتج بمخزون مباشر بدون خيارات ألوان ومقاسات."
                        : "Direct inventory product without colors and sizes.")}
                  </p>
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={productType === "variant"}
                className={`product-type-card ${productType === "variant" ? "selected" : ""}`}
                onClick={() => setProductType("variant")}
              >
                <div className="type-card-radio">
                  <div className="radio-indicator">
                    {productType === "variant" && <div className="radio-inner-dot" />}
                  </div>
                </div>
                <div className="type-card-content">
                  <div className="type-card-title-row">
                    <span className="type-card-title">
                      {t("variantProduct") ||
                        (isRTL ? "منتج بخيارات (Color + Size)" : "Product with Variants")}
                    </span>
                    <span className="type-card-badge">has_variants = 1</span>
                  </div>
                  <p className="type-card-desc">
                    {t("variantProductDesc") ||
                      (isRTL
                        ? "منتج يتضمن تركيبات متعددة من الألوان والمقاسات والكميات المستقلة."
                        : "Product with combinations of colors, sizes, and independent quantities.")}
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* SECTION 2: Basic Information */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">2</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {t("basicInfo") || (isRTL ? "المعلومات الأساسية" : "Basic Information")}
                </h3>
                <p className="section-desc">
                  {isRTL
                    ? "اسم ووصف المنتج باللغتين العربية والإنجليزية"
                    : "Product name and description in both Arabic and English"}
                </p>
              </div>
            </div>

            <div className="form-grid-2col" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label htmlFor="name_ar" className="form-label">
                  <span>{t("productNameAr") || "اسم المنتج بالعربية"}</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="name_ar"
                  name="name_ar"
                  type="text"
                  dir="rtl"
                  placeholder={isRTL ? "مثال: تيشيرت قطن فاخر" : "e.g. تيشيرت قطن"}
                  className={`form-input ${fieldErrors.name_ar ? "has-error" : ""}`}
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
                  <span>{t("productNameEn") || "اسم المنتج بالإنجليزية"}</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="name_en"
                  name="name_en"
                  type="text"
                  dir="ltr"
                  placeholder="e.g. Premium Cotton T-Shirt"
                  className={`form-input ${fieldErrors.name_en ? "has-error" : ""}`}
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
                  <span>{t("productDescAr") || "الوصف بالعربية"}</span>
                  <span className="required-star">*</span>
                </label>
                <textarea
                  id="description_ar"
                  name="description_ar"
                  dir="rtl"
                  rows={3}
                  placeholder={isRTL ? "اكتب وصفاً مفصلاً للمنتج..." : "Arabic description..."}
                  className={`form-textarea ${fieldErrors.description_ar ? "has-error" : ""}`}
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
                  <span>{t("productDescEn") || "الوصف بالإنجليزية"}</span>
                  <span className="required-star">*</span>
                </label>
                <textarea
                  id="description_en"
                  name="description_en"
                  dir="ltr"
                  rows={3}
                  placeholder="English description..."
                  className={`form-textarea ${fieldErrors.description_en ? "has-error" : ""}`}
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

          {/* SECTION 3: Pricing */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">3</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {t("pricing") || (isRTL ? "التسعير" : "Pricing")}
                </h3>
                <p className="section-desc">
                  {isRTL
                    ? "حدد السعر الحالي للمنتج والسعر السابق في حال وجود خصم"
                    : "Set current price and optional previous price for discount display"}
                </p>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label htmlFor="price" className="form-label">
                  <span>{t("currentPrice") || (isRTL ? "السعر الحالي" : "Price")}</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={isRTL ? "مثال: 400" : "e.g. 400"}
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
                    {t("oldPrice") || (isRTL ? "السعر القديم (اختياري)" : "Old Price (Optional)")}
                  </span>
                </label>
                <input
                  id="old_price"
                  name="old_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={isRTL ? "مثال: 450" : "e.g. 450"}
                  className={`form-input ${fieldErrors.old_price ? "has-error" : ""}`}
                  value={form.old_price}
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

            {discountCalculation.isValid && (
              <div className="pricing-discount-banner" aria-live="polite">
                <div className="discount-tag">
                  <span>{discountCalculation.percentage}%</span>
                  <span>{t("discountBadge") || (isRTL ? "خصم" : "OFF")}</span>
                </div>
                <div className="discount-calc-details">
                  <span>
                    {isRTL
                      ? `توفير ${discountCalculation.savings} ج.م للعميل مقارنة بالسعر السابق`
                      : `Customers save ${discountCalculation.savings} EGP compared to old price`}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: Inventory & Variants */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">4</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {productType === "normal"
                    ? t("inventory") || (isRTL ? "المخزون" : "Inventory")
                    : t("variantBuilder") ||
                      (isRTL ? "منشئ الخيارات (الألوان والمقاسات)" : "Variant Builder")}
                </h3>
                <p className="section-desc">
                  {productType === "normal"
                    ? isRTL
                      ? "حدد إجمالي الكمية المتاحة للمنتج العادي في المخزن"
                      : "Set the total available stock quantity for this normal product"
                    : isRTL
                    ? "حدد خيارات الألوان والمقاسات والكمية الخاصة بكل خيار مستقلاً"
                    : "Specify combinations of color, size, and independent stock quantity"}
                </p>
              </div>
            </div>

            {productType === "normal" ? (
              <div className="inventory-normal-box">
                <div className="form-group" style={{ maxWidth: "340px" }}>
                  <label htmlFor="quantity" className="form-label">
                    <span>
                      {t("productQuantity") || (isRTL ? "الكمية المتوفرة" : "Stock Quantity")}
                    </span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    placeholder={isRTL ? "مثال: 54" : "e.g. 54"}
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
            ) : (
              <div className="variant-builder-container">
                <div className="variant-builder-header">
                  <div className="variant-count-indicator">
                    <span>
                      {isRTL
                        ? `تمت إضافة (${variants.length}) خيارات | إجمالي المخزون: (${totalVariantStock}) قطعة`
                        : `(${variants.length}) variants defined | Total stock: (${totalVariantStock}) units`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="btn-add-variant"
                  >
                    <FiPlus />
                    <span>{t("addVariant") || (isRTL ? "إضافة خيار" : "Add Variant")}</span>
                  </button>
                </div>

                {variantDuplicateError && (
                  <div className="variant-duplicate-banner" role="alert">
                    <FiAlertCircle size={18} />
                    <span>{variantDuplicateError}</span>
                  </div>
                )}

                {fieldErrors.variants && !variantDuplicateError && (
                  <div className="field-error" style={{ marginBottom: "0.5rem" }}>
                    <FiAlertCircle />
                    <span>{fieldErrors.variants}</span>
                  </div>
                )}

                <div className="variants-list">
                  {variants.map((variant, index) => {
                    const isDuplicate = isVariantRowDuplicate(variant, index);

                    return (
                      <div
                        key={`variant-row-${index}`}
                        className={`variant-card ${isDuplicate ? "has-duplicate-error" : ""}`}
                      >
                        <div className="variant-card-header">
                          <div className="variant-card-title">
                            <span className="variant-badge-num">{index + 1}</span>
                            <span>
                              {t("variantNumber") || (isRTL ? "خيار" : "Variant")} #{index + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="btn-remove-variant"
                            disabled={variants.length <= 1}
                            title={t("removeVariant") || (isRTL ? "حذف الخيار" : "Remove Variant")}
                          >
                            <FiTrash2 />
                            <span>{t("removeVariant") || (isRTL ? "حذف" : "Remove")}</span>
                          </button>
                        </div>

                        <div className="variant-grid">
                          <div className="form-group">
                            <label
                              htmlFor={`variant-color-${index}`}
                              className="form-label"
                            >
                              <span>{t("selectColor") || (isRTL ? "اللون" : "Color")}</span>
                              <span className="required-star">*</span>
                            </label>
                            <select
                              id={`variant-color-${index}`}
                              className={`form-select ${
                                !variant.color_id && fieldErrors.variants ? "has-error" : ""
                              }`}
                              value={variant.color_id}
                              onChange={(e) =>
                                handleVariantChange(index, "color_id", e.target.value)
                              }
                            >
                              <option value="">
                                {isRTL ? "-- اختر اللون --" : "-- Select Color --"}
                              </option>
                              {colors.map((c) => {
                                const displayName =
                                  language === "ar"
                                    ? c.name_ar || c.name_en
                                    : c.name_en || c.name_ar;
                                return (
                                  <option key={`color-opt-${c.id}`} value={c.id}>
                                    {displayName}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="form-group">
                            <label
                              htmlFor={`variant-size-${index}`}
                              className="form-label"
                            >
                              <span>{t("selectSize") || (isRTL ? "المقاس" : "Size")}</span>
                              <span className="required-star">*</span>
                            </label>
                            <select
                              id={`variant-size-${index}`}
                              className={`form-select ${
                                !variant.size_id && fieldErrors.variants ? "has-error" : ""
                              }`}
                              value={variant.size_id}
                              onChange={(e) =>
                                handleVariantChange(index, "size_id", e.target.value)
                              }
                            >
                              <option value="">
                                {isRTL ? "-- اختر المقاس --" : "-- Select Size --"}
                              </option>
                              {sizes.map((s) => (
                                <option key={`size-opt-${s.id}`} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label
                              htmlFor={`variant-quantity-${index}`}
                              className="form-label"
                            >
                              <span>{t("variantQuantity") || (isRTL ? "الكمية" : "Quantity")}</span>
                              <span className="required-star">*</span>
                            </label>
                            <input
                              id={`variant-quantity-${index}`}
                              type="number"
                              min="1"
                              step="1"
                              placeholder={isRTL ? "مثال: 10" : "e.g. 10"}
                              className={`form-input ${
                                (!variant.quantity || parseInt(variant.quantity, 10) <= 0) &&
                                fieldErrors.variants
                                  ? "has-error"
                                  : ""
                              }`}
                              value={variant.quantity}
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
              </div>
            )}
          </section>

          {/* SECTION 5: Images */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">5</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {t("productImages") || (isRTL ? "صور المنتج" : "Product Images")}
                </h3>
                <p className="section-desc">
                  {t("imagesHint") ||
                    (isRTL
                      ? "يمكنك رفع صور متعددة (JPG, PNG, WEBP) - بحد أقصى 5 ميجابايت لكل صورة"
                      : "Upload multiple images (JPG, PNG, WEBP) - Max 5MB per image")}
                </p>
              </div>
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
                      ? "اضغط لاختيار صور المنتج أو اسحبها هنا"
                      : "Click to upload product images or drag & drop")}
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

              {imageFiles.length > 0 && (
                <div className="image-previews-grid">
                  {imageFiles.map((item, index) => (
                    <div key={item.id} className="image-preview-card">
                      <div className="preview-img-container">
                        <img src={item.previewUrl} alt={`Preview ${index + 1}`} />
                        {index === 0 && (
                          <span className="preview-badge-primary">
                            {isRTL ? "الرئيسية" : "Primary"}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="btn-remove-image"
                          title={isRTL ? "إزالة الصورة" : "Remove image"}
                          aria-label={isRTL ? "إزالة الصورة" : "Remove image"}
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
          </section>

          {/* SECTION 6: Categories */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">6</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {t("categories") || (isRTL ? "التصنيفات" : "Categories")}
                </h3>
                <p className="section-desc">
                  {t("selectCategoriesPrompt") ||
                    (isRTL
                      ? "اختر تصنيفاً واحداً أو أكثر للمنتج"
                      : "Select one or more categories for this product")}
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
                    const isSelected = selectedCategories.some((id) => Number(id) === Number(cat.id));
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

          {/* SECTION 7: Review / Summary */}
          <section className="product-section-card">
            <div className="product-section-header">
              <div className="section-number-badge">7</div>
              <div className="section-title-wrap">
                <h3 className="section-title">
                  {t("reviewSummary") || (isRTL ? "مراجعة وملخص المنتج" : "Product Summary Review")}
                </h3>
                <p className="section-desc">
                  {isRTL
                    ? "نظرة سريعة على بيانات المنتج قبل الإرسال والاعتماد"
                    : "Quick overview of the product details before final submission"}
                </p>
              </div>
            </div>

            <div className="summary-container">
              <div className="summary-items-grid">
                <div className="summary-item">
                  <span className="summary-label">
                    {t("tableColNameAr") || "الاسم بالعربية"}
                  </span>
                  <span className="summary-value">
                    {form.name_ar.trim() || "-"}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">
                    {t("tableColNameEn") || "الاسم بالإنجليزية"}
                  </span>
                  <span className="summary-value" dir="ltr">
                    {form.name_en.trim() || "-"}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">
                    {t("currentPrice") || "السعر"}
                  </span>
                  <span className="summary-value" style={{ color: "var(--vendo-primary)" }}>
                    {form.price ? `${form.price} EGP` : "-"}
                    {discountCalculation.isValid && (
                      <span style={{ fontSize: "0.78rem", color: "var(--vendo-success-text)", marginInlineStart: "0.4rem" }}>
                        ({discountCalculation.percentage}% OFF)
                      </span>
                    )}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">
                    {t("productType") || "نوع المنتج ومخزونه"}
                  </span>
                  <span className="summary-value">
                    {productType === "normal"
                      ? `${t("normalProduct") || "منتج عادي"} (${form.quantity || 0} ${
                          isRTL ? "قطعة" : "units"
                        })`
                      : `${t("variantProduct") || "منتج بخيارات"} (${variants.length} ${
                          t("totalVariants") || "خيارات"
                        } | ${totalVariantStock} ${isRTL ? "قطعة" : "units"})`}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">
                    {t("selectedImagesCount") || "عدد الصور"}
                  </span>
                  <span className="summary-value">
                    {imageFiles.length} {isRTL ? "صور مختارة" : "images selected"}
                  </span>
                </div>

                <div className="summary-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="summary-label">
                    {t("selectedCategoriesCount") || "التصنيفات المختارة"} ({selectedCategories.length})
                  </span>
                  <div className="summary-categories-list">
                    {selectedCategories.length > 0 ? (
                      selectedCategories.map((catId) => {
                        const matched = categories.find((c) => Number(c.id) === Number(catId));
                        const label = matched
                          ? language === "ar"
                            ? matched.name_ar || matched.name_en
                            : matched.name_en || matched.name_ar
                          : `#${catId}`;
                        return (
                          <span key={`sum-cat-${catId}`} className="summary-cat-badge">
                            {label}
                          </span>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: "0.84rem", color: "var(--vendo-gray-muted)" }}>
                        {t("noCategoriesSelected") || "لم يتم تحديد أي تصنيف بعد"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: Actions Footer */}
          <footer className="form-actions-bar">
            <button
              type="button"
              className="btn-form-reset"
              onClick={handleResetForm}
              disabled={isSubmitting}
            >
              <FiRefreshCw />
              <span>{t("clearForm") || (isRTL ? "إعادة تعيين" : "Reset Form")}</span>
            </button>

            <button
              type="submit"
              className="btn-form-submit"
              disabled={isSubmitting || (productType === "variant" && Boolean(variantDuplicateError))}
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="submit-spinner" />
                  <span>
                    {t("creatingProduct") || (isRTL ? "جاري إنشاء المنتج..." : "Creating Product...")}
                  </span>
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  <span>
                    {t("createProductBtn") || (isRTL ? "إنشاء المنتج" : "Create Product")}
                  </span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    );
  }

  // ====================================================
  // RENDER: PRODUCTS LIST VIEW (All Products & Offers)
  // ====================================================
  return (
    <div className="products-dashboard-view">
      {/* Top Header */}
      <header className="products-page-header">
        <div className="products-header-info">
          <div className="products-header-icon" aria-hidden="true">
            <FiPackage />
          </div>
          <div>
            <h2 className="products-header-title">
              {t("products") || (isRTL ? "المنتجات" : "Products")}
            </h2>
            <p className="products-header-subtitle">
              {t("productManagementSubtitle") ||
                (isRTL
                  ? "مراجعة وإدارة قوائم المنتجات والكتالوج العام والعروض الخاصة."
                  : "Review and manage product catalog, promotional offers, and stock.")}
            </p>
          </div>
        </div>

        <div className="products-header-actions">
          <Link to="/dashboard/products/create" className="btn-header-primary">
            <FiPlus />
            <span>{t("addProduct") || (isRTL ? "إضافة منتج" : "Add Product")}</span>
          </Link>
        </div>
      </header>

      {/* Tabs Bar: All Products vs Offers */}
      <nav className="products-tabs-bar" aria-label="Products Sections">
        <button
          type="button"
          className={`products-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => handleTabSwitch("all")}
        >
          <FiPackage />
          <span>{t("allProductsTab") || (isRTL ? "جميع المنتجات" : "All Products")}</span>
          <span className="tab-badge">{paginationAll.total || allProducts.length}</span>
        </button>

        <button
          type="button"
          className={`products-tab-btn tab-offers ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => handleTabSwitch("offers")}
        >
          <FiPercent />
          <span>{t("offersTab") || (isRTL ? "المنتجات عليها عروض" : "Products on Sale")}</span>
          <span className="tab-badge">{paginationOffers.total || offerProducts.length}</span>
        </button>
      </nav>

      {/* Search & Filter Bar */}
      <div className="products-filter-bar">
        <div className="products-search-box">
          <FiSearch className="search-icon-pos" aria-hidden="true" />
          <input
            type="text"
            className="products-search-input"
            placeholder={
              isRTL ? "البحث بالاسم، المعرف، أو القسم..." : "Search by name, ID, or category..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="products-count-badge">
          <span>
            {isRTL
              ? `عرض ${currentDisplayedProducts.length} من أصل ${currentPagination.total || 0}`
              : `Showing ${currentDisplayedProducts.length} of ${currentPagination.total || 0}`}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {currentError && (
        <div className="products-alert-box" role="alert">
          <div className="alert-message-content">
            <FiAlertCircle size={20} />
            <span>{currentError}</span>
          </div>
          <button
            type="button"
            className="btn-alert-retry"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
          >
            <FiRefreshCw />
            <span>{t("btnRetry") || "إعادة المحاولة"}</span>
          </button>
        </div>
      )}

      {/* Table & Mobile Cards Card */}
      <div className="products-table-card">
        {currentLoading ? (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-blue">
              <FiLoader className="spin-animation" />
            </div>
            <h4 className="state-title">
              {activeTab === "all"
                ? t("loadingProducts") || "جاري تحميل المنتجات..."
                : t("loadingOffers") || "جاري تحميل العروض..."}
            </h4>
          </div>
        ) : currentDisplayedProducts.length === 0 ? (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-amber">
              <FiPackage />
            </div>
            <h4 className="state-title">
              {activeTab === "all"
                ? t("noProductsFound") || "لا توجد منتجات حالياً"
                : t("noOffersFound") || "لا توجد منتجات عليها عروض"}
            </h4>
            <p className="state-desc">
              {activeTab === "all"
                ? t("noProductsFoundDesc") || "لم يتم العثور على أي منتجات مضافة إلى الكتالوج حتى الآن."
                : t("noOffersFoundDesc") || "لا توجد أي منتجات خاضعة لخصومات أو عروض حالياً في النظام."}
            </p>
            {activeTab === "all" && (
              <Link to="/dashboard/products/create" className="btn-header-primary" style={{ marginTop: "0.5rem" }}>
                <FiPlus />
                <span>{t("addProduct") || (isRTL ? "إضافة منتج الآن" : "Add Product Now")}</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="products-table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>{t("tableColProduct") || "المنتج"}</th>
                    <th>{t("tableColType") || "النوع"}</th>
                    <th>{t("tableColPrice") || "السعر"}</th>
                    <th>{t("tableColStock") || "المخزون"}</th>
                    <th>{t("tableColCategories") || "التصنيفات"}</th>
                    <th>{t("tableColStatus") || "الحالة"}</th>
                    <th>{t("tableColCreatedAt") || "تاريخ الإضافة"}</th>
                    <th style={{ textAlign: "center" }}>{t("tableColActions") || "الإجراءات"}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDisplayedProducts.map((product) => {
                    const primaryImage =
                      Array.isArray(product.images) && product.images.length > 0
                        ? product.images[0].image
                        : null;

                    const displayName =
                      language === "ar"
                        ? product.name_ar || product.name_en
                        : product.name_en || product.name_ar;

                    const totalStock = calculateProductStock(product);

                    return (
                      <tr key={`product-row-${product.id}`}>
                        {/* Product Image & Title */}
                        <td>
                          <div className="product-cell-main">
                            <div className="product-thumb-wrap">
                              {primaryImage ? (
                                <img
                                  src={primaryImage}
                                  alt={displayName}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <FiPackage className="product-thumb-fallback" />
                              )}
                            </div>
                            <div className="product-name-info">
                              <span className="product-title-text">{displayName}</span>
                              <span className="product-sku-sub">#{product.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Product Type */}
                        <td>
                          {product.has_variants ? (
                            <span className="badge-type variant">
                              <FiSliders />
                              <span>{t("withVariants") || (isRTL ? "بخيارات" : "With Variants")}</span>
                            </span>
                          ) : (
                            <span className="badge-type normal">
                              <FiBox />
                              <span>{t("normalProduct") || (isRTL ? "منتج عادي" : "Normal Product")}</span>
                            </span>
                          )}
                        </td>

                        {/* Price & Old Price & Discount */}
                        <td>
                          <div className="price-col-wrap">
                            <span className="price-current">{product.price} EGP</span>
                            {product.old_price != null && product.old_price > product.price && (
                              <div className="price-old-row">
                                <span className="price-old-strikethrough">{product.old_price} EGP</span>
                                {product.discount_percentage && (
                                  <span className="badge-offer-discount">{product.discount_percentage}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stock Quantity */}
                        <td>
                          <div className="stock-cell-wrap">
                            <span className="stock-value-text">{totalStock}</span>
                            <span className="stock-sub-badge">
                              {product.has_variants
                                ? isRTL
                                  ? `مخزون الخيارات: ${totalStock}`
                                  : `Variant Stock: ${totalStock}`
                                : isRTL
                                ? "قطعة بالمخزن"
                                : "in stock"}
                            </span>
                          </div>
                        </td>

                        {/* Categories */}
                        <td>
                          <div className="table-categories-list">
                            {Array.isArray(product.categories) && product.categories.length > 0 ? (
                              product.categories.slice(0, 2).map((cat, idx) => {
                                const catName =
                                  language === "ar"
                                    ? cat.name_ar || cat.name_en
                                    : cat.name_en || cat.name_ar;
                                return (
                                  <span key={`cat-b-${product.id}-${cat.id || idx}`} className="category-badge-chip">
                                    {catName}
                                  </span>
                                );
                              })
                            ) : (
                              <span style={{ fontSize: "0.8rem", color: "var(--vendo-gray-muted)" }}>
                                {t("noCategoryAssigned") || (isRTL ? "بدون تصنيف" : "Uncategorized")}
                              </span>
                            )}
                            {Array.isArray(product.categories) && product.categories.length > 2 && (
                              <span className="category-badge-more">
                                +{product.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          {product.status ? (
                            <span className="dash-badge-status dash-badge-active">
                              {t("statusActive") || (isRTL ? "نشط" : "Active")}
                            </span>
                          ) : (
                            <span className="dash-badge-status dash-badge-pending">
                              {t("statusInactive") || (isRTL ? "غير نشط" : "Inactive")}
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td>
                          <span style={{ fontSize: "0.84rem", color: "var(--vendo-gray-muted)" }}>
                            {formatDisplayDate(product.created_at, isRTL)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                            <button
                              type="button"
                              className="btn-table-details"
                              onClick={() => {
                                setSelectedProduct(product);
                                setActiveModalImageIndex(0);
                              }}
                              title={t("viewDetails") || "عرض التفاصيل"}
                            >
                              <FiEye />
                              <span>{t("viewDetails") || "عرض"}</span>
                            </button>
                            <Link
                              to={`/dashboard/products/edit/${product.id}`}
                              state={{ product }}
                              className="btn-table-edit"
                              title={t("editProduct") || (isRTL ? "تعديل المنتج" : "Edit Product")}
                            >
                              <FiEdit2 />
                              <span>{t("editProduct") || (isRTL ? "تعديل" : "Edit")}</span>
                            </Link>
                            {isAdmin && (
                              <button
                                type="button"
                                className="btn-table-delete"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setDeleteError("");
                                }}
                                title={t("btnDelete") || (isRTL ? "حذف" : "Delete")}
                              >
                                <FiTrash2 />
                                <span>{t("btnDelete") || (isRTL ? "حذف" : "Delete")}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Displayed on screens <= 768px) */}
            <div className="products-mobile-cards">
              {currentDisplayedProducts.map((product) => {
                const primaryImage =
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0].image
                    : null;

                const displayName =
                  language === "ar"
                    ? product.name_ar || product.name_en
                    : product.name_en || product.name_ar;

                const totalStock = calculateProductStock(product);

                return (
                  <div key={`mobile-card-${product.id}`} className="product-mobile-card">
                    <div className="mobile-card-header">
                      <div className="mobile-card-thumb">
                        {primaryImage ? (
                          <img src={primaryImage} alt={displayName} loading="lazy" />
                        ) : (
                          <FiPackage className="product-thumb-fallback" />
                        )}
                      </div>
                      <div className="mobile-card-info">
                        <h4 className="mobile-card-title">{displayName}</h4>
                        <div className="mobile-card-meta-row">
                          <span style={{ fontSize: "0.75rem", color: "var(--vendo-gray-muted)" }}>
                            #{product.id}
                          </span>
                          {product.has_variants ? (
                            <span className="badge-type variant">
                              {t("withVariants") || "بخيارات"}
                            </span>
                          ) : (
                            <span className="badge-type normal">
                              {t("normalProduct") || "عادي"}
                            </span>
                          )}
                          {product.status ? (
                            <span className="dash-badge-status dash-badge-active" style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem" }}>
                              {t("statusActive") || "نشط"}
                            </span>
                          ) : (
                            <span className="dash-badge-status dash-badge-pending" style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem" }}>
                              {t("statusInactive") || "غير نشط"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mobile-card-stats">
                      <div className="mobile-stat-box">
                        <span className="mobile-stat-label">{t("tableColPrice") || "السعر"}</span>
                        <span className="mobile-stat-value">
                          {product.price} EGP
                          {product.old_price != null && product.old_price > product.price && (
                            <span style={{ fontSize: "0.72rem", color: "var(--vendo-gray-muted)", textDecoration: "line-through", marginInlineStart: "0.3rem" }}>
                              {product.old_price} EGP
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="mobile-stat-box">
                        <span className="mobile-stat-label">{t("tableColStock") || "المخزون"}</span>
                        <span className="mobile-stat-value">
                          {totalStock}{" "}
                          <span style={{ fontSize: "0.74rem", fontWeight: 500, color: "var(--vendo-gray-muted)" }}>
                            {product.has_variants ? (isRTL ? "عبر الخيارات" : "variants") : (isRTL ? "قطعة" : "units")}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="mobile-card-footer" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-mobile-details"
                        style={{ flex: 1, minWidth: "85px" }}
                        onClick={() => {
                          setSelectedProduct(product);
                          setActiveModalImageIndex(0);
                        }}
                      >
                        <FiEye />
                        <span>{t("viewDetails") || (isRTL ? "عرض" : "View")}</span>
                      </button>
                      <Link
                        to={`/dashboard/products/edit/${product.id}`}
                        state={{ product }}
                        className="btn-mobile-edit"
                        style={{ flex: 1, minWidth: "85px", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                      >
                        <FiEdit2 />
                        <span>{t("editProduct") || (isRTL ? "تعديل" : "Edit")}</span>
                      </Link>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-mobile-delete"
                          style={{ flex: 1, minWidth: "85px" }}
                          onClick={() => {
                            setProductToDelete(product);
                            setDeleteError("");
                          }}
                        >
                          <FiTrash2 />
                          <span>{t("btnDelete") || (isRTL ? "حذف" : "Delete")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {currentPagination.last_page > 1 && (
              <div className="pagination-bar" style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--vendo-border)" }}>
                <div className="pagination-info">
                  <span>
                    {t("paginationPage") || "صفحة"} <strong>{currentPagination.current_page}</strong>{" "}
                    {t("paginationOf") || "من"} <strong>{currentPagination.last_page}</strong> (
                    {currentPagination.total} {t("productsCountLabel") || "منتج"})
                  </span>
                </div>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPagination.current_page <= 1 || currentLoading}
                    onClick={() => handlePageChange(currentPagination.current_page - 1)}
                    aria-label="Previous Page"
                  >
                    {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
                    <span>{t("paginationPrev") || "السابق"}</span>
                  </button>

                  {Array.from({ length: currentPagination.last_page }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={`page-btn-${pageNum}`}
                      type="button"
                      className={`btn-page-number ${
                        pageNum === currentPagination.current_page ? "active" : ""
                      }`}
                      disabled={currentLoading}
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={pageNum === currentPagination.current_page ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={
                      currentPagination.current_page >= currentPagination.last_page || currentLoading
                    }
                    onClick={() => handlePageChange(currentPagination.current_page + 1)}
                    aria-label="Next Page"
                  >
                    <span>{t("paginationNext") || "التالي"}</span>
                    {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================================================
          PRODUCT DETAILS MODAL
          ==================================================== */}
      {selectedProduct && (
        <div
          className="vendo-modal-backdrop"
          onClick={() => setSelectedProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-details-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="product-details-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-blue">
                  <FiPackage />
                </div>
                <span>
                  {t("productDetailsModalTitle") || "تفاصيل المنتج"} #{selectedProduct.id}
                </span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedProduct(null)}
                aria-label={t("close") || "إغلاق"}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="details-modal-grid">
              {/* Gallery Section */}
              <div className="details-gallery-box">
                <div className="details-main-img-wrap">
                  {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? (
                    <img
                      src={
                        selectedProduct.images[activeModalImageIndex]?.image ||
                        selectedProduct.images[0].image
                      }
                      alt={selectedProduct.name_en || "Product"}
                    />
                  ) : (
                    <FiPackage size={48} color="var(--vendo-gray-subtle)" />
                  )}
                </div>

                {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                  <div className="details-thumbs-list">
                    {selectedProduct.images.map((imgObj, idx) => (
                      <button
                        key={`thumb-btn-${idx}`}
                        type="button"
                        className={`details-thumb-btn ${
                          idx === activeModalImageIndex ? "active" : ""
                        }`}
                        onClick={() => setActiveModalImageIndex(idx)}
                      >
                        <img src={imgObj.image} alt={`Thumb ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Information Section */}
              <div className="details-info-box">
                {/* Titles */}
                <div className="details-info-section">
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--vendo-dark)" }}>
                    {language === "ar"
                      ? selectedProduct.name_ar || selectedProduct.name_en
                      : selectedProduct.name_en || selectedProduct.name_ar}
                  </h4>
                  <span style={{ fontSize: "0.85rem", color: "var(--vendo-gray-muted)" }}>
                    {language === "ar" ? selectedProduct.name_en : selectedProduct.name_ar}
                  </span>
                </div>

                {/* Key Values Grid */}
                <div className="details-key-values-grid">
                  <div className="details-key-val">
                    <span className="details-val-label">{t("currentPrice") || "السعر"}</span>
                    <span className="details-val-content" style={{ color: "var(--vendo-primary)" }}>
                      {selectedProduct.price} EGP
                    </span>
                  </div>

                  <div className="details-key-val">
                    <span className="details-val-label">{t("tableColOldPrice") || "السعر القديم"}</span>
                    <span className="details-val-content">
                      {selectedProduct.old_price != null ? (
                        <span>
                          {selectedProduct.old_price} EGP{" "}
                          {selectedProduct.discount_percentage && (
                            <span className="badge-offer-discount">{selectedProduct.discount_percentage}</span>
                          )}
                        </span>
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>

                  <div className="details-key-val">
                    <span className="details-val-label">{t("tableColStock") || "المخزون"}</span>
                    <span className="details-val-content">
                      {calculateProductStock(selectedProduct)}{" "}
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--vendo-gray-muted)" }}>
                        {selectedProduct.has_variants
                          ? isRTL
                            ? "(مخزون الخيارات)"
                            : "(variant stock)"
                          : isRTL
                          ? "(مباشر)"
                          : "(direct)"}
                      </span>
                    </span>
                  </div>

                  <div className="details-key-val">
                    <span className="details-val-label">{t("tableColStatus") || "الحالة"}</span>
                    <span className="details-val-content">
                      {selectedProduct.status ? (
                        <span className="dash-badge-status dash-badge-active">
                          {t("statusActive") || "نشط"}
                        </span>
                      ) : (
                        <span className="dash-badge-status dash-badge-pending">
                          {t("statusInactive") || "غير نشط"}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="details-key-val">
                    <span className="details-val-label">{t("tableColCreatedAt") || "تاريخ الإضافة"}</span>
                    <span className="details-val-content" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {formatDisplayDate(selectedProduct.created_at, isRTL)}
                    </span>
                  </div>

                  <div className="details-key-val">
                    <span className="details-val-label">{t("detailsUpdatedAt") || "آخر تحديث"}</span>
                    <span className="details-val-content" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {formatDisplayDate(selectedProduct.updated_at, isRTL)}
                    </span>
                  </div>
                </div>

                {/* Categories */}
                {Array.isArray(selectedProduct.categories) && selectedProduct.categories.length > 0 && (
                  <div className="details-info-section">
                    <span className="details-val-label">{t("categories") || "التصنيفات"}</span>
                    <div className="summary-categories-list">
                      {selectedProduct.categories.map((c, idx) => (
                        <span key={`det-cat-${c.id || idx}`} className="summary-cat-badge">
                          {language === "ar" ? c.name_ar || c.name_en : c.name_en || c.name_ar}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descriptions */}
                <div className="details-info-section">
                  <span className="details-val-label">{t("descriptionLabel") || "الوصف"}</span>
                  <div className="details-desc-box">
                    <p style={{ margin: 0 }}>
                      {language === "ar"
                        ? selectedProduct.description_ar || selectedProduct.description_en
                        : selectedProduct.description_en || selectedProduct.description_ar}
                    </p>
                  </div>
                </div>

                {/* Variants Breakdown (If variant product) */}
                {selectedProduct.has_variants && (
                  <div className="details-info-section">
                    <h5 className="details-section-title">
                      <FiSliders />
                      <span>{t("variantsListTitle") || "خيارات وتشكيلات المنتج"}</span>
                    </h5>

                    {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 ? (
                      <div className="details-variants-wrap">
                        <table className="details-variants-table">
                          <thead>
                            <tr>
                              <th>{t("color") || "اللون"}</th>
                              <th>{t("size") || "المقاس"}</th>
                              <th>{t("quantity") || "الكمية"}</th>
                              <th>{t("tableColStatus") || "الحالة"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProduct.variants.map((v, idx) => {
                              const colorName = v.color
                                ? language === "ar"
                                  ? v.color.name_ar || v.color.name_en
                                  : v.color.name_en || v.color.name_ar
                                : `Color #${v.color_id || idx}`;

                              const sizeName = v.size ? v.size.name : `Size #${v.size_id || idx}`;

                              return (
                                <tr key={`var-detail-${v.id || idx}`}>
                                  <td>{colorName}</td>
                                  <td>{sizeName}</td>
                                  <td>
                                    <strong>{v.quantity}</strong>
                                  </td>
                                  <td>
                                    {v.status === false ? (
                                      <span className="dash-badge-status dash-badge-pending" style={{ fontSize: "0.72rem" }}>
                                        {t("statusInactive") || "غير نشط"}
                                      </span>
                                    ) : (
                                      <span className="dash-badge-status dash-badge-active" style={{ fontSize: "0.72rem" }}>
                                        {t("statusActive") || "نشط"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.85rem", color: "var(--vendo-gray-muted)" }}>
                        {t("noVariantsFound") || "لا توجد خيارات لهذا المنتج"}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Section */}
                <div className="details-info-section">
                  <h5 className="details-section-title">
                    <FiStar />
                    <span>{t("reviewsListTitle") || "مراجعات وتقييمات العملاء"}</span>
                  </h5>

                  {Array.isArray(selectedProduct.reviews) && selectedProduct.reviews.length > 0 ? (
                    <div className="details-reviews-list">
                      {selectedProduct.reviews.map((rev, idx) => (
                        <div key={`rev-${rev.id || idx}`} className="details-review-card">
                          <div className="review-card-header">
                            <span className="review-user-name">
                              {rev.user?.name || rev.user_name || "Customer"}
                            </span>
                            {rev.rating && (
                              <div className="review-rating-stars">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <FiStar
                                    key={i}
                                    style={{
                                      fill: i < rev.rating ? "#f59e0b" : "none",
                                      stroke: "#f59e0b",
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          {rev.comment && <p className="review-card-comment">{rev.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.85rem", color: "var(--vendo-gray-muted)" }}>
                      {t("noReviewsYet") || "لا توجد مراجعات حتى الآن"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="vendo-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link
                to={`/dashboard/products/edit/${selectedProduct.id}`}
                state={{ product: selectedProduct }}
                className="btn-header-primary"
                style={{ textDecoration: "none", fontSize: "0.85rem", padding: "0.5rem 1rem" }}
              >
                <FiEdit2 />
                <span>{t("editProduct") || (isRTL ? "تعديل المنتج" : "Edit Product")}</span>
              </Link>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedProduct(null)}
              >
                {t("close") || "إغلاق"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          DELETE PRODUCT CONFIRMATION MODAL
          ==================================================== */}
      {productToDelete && (
        <div
          className="vendo-modal-backdrop"
          onClick={() => {
            if (!isDeletingProduct) {
              setProductToDelete(null);
              setDeleteError("");
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="delete-product-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-red">
                  <FiTrash2 />
                </div>
                <span>
                  {t("confirmDeleteProductTitle") ||
                    (isRTL ? "تأكيد حذف المنتج" : "Confirm Product Deletion")}
                </span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => {
                  if (!isDeletingProduct) {
                    setProductToDelete(null);
                    setDeleteError("");
                  }
                }}
                disabled={isDeletingProduct}
                aria-label={t("close") || "إغلاق"}
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
                <h4 className="delete-confirm-title">
                  {t("confirmDeleteProductTitle") ||
                    (isRTL ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?")}
                </h4>
                <p className="delete-confirm-text">
                  {t("thisActionCannotBeUndone") ||
                    (isRTL ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone.")}
                </p>

                {/* Compact Product Info Preview */}
                <div className="delete-product-info-box">
                  <div className="delete-product-thumb-wrap">
                    {Array.isArray(productToDelete.images) &&
                    productToDelete.images.length > 0 &&
                    productToDelete.images[0]?.image ? (
                      <img
                        src={productToDelete.images[0].image}
                        alt={productToDelete.name_en || productToDelete.name_ar}
                        className="delete-product-thumb"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <FiPackage className="delete-product-thumb-fallback" />
                    )}
                  </div>
                  <div className="delete-product-meta">
                    <span className="delete-product-name-ar">
                      {productToDelete.name_ar || "-"}
                    </span>
                    <span className="delete-product-name-en" dir="ltr">
                      {productToDelete.name_en || "-"}
                    </span>
                    <div className="delete-product-id-badge">
                      <span>
                        {isRTL
                          ? `معرف المنتج: ${productToDelete.id}`
                          : `Product ID: ${productToDelete.id}`}
                      </span>
                      {productToDelete.has_variants ? (
                        <span className="delete-type-chip variant">
                          {isRTL ? "بخيارات" : "Variants"}
                        </span>
                      ) : (
                        <span className="delete-type-chip normal">
                          {isRTL ? "عادي" : "Normal"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {deleteError && (
                  <div className="delete-error-banner" role="alert">
                    <FiAlertCircle />
                    <span>{deleteError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => {
                  if (!isDeletingProduct) {
                    setProductToDelete(null);
                    setDeleteError("");
                  }
                }}
                disabled={isDeletingProduct}
              >
                {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
              >
                {isDeletingProduct ? (
                  <>
                    <FiLoader className="spin-animation" />
                    <span>
                      {t("deleting") || (isRTL ? "جاري الحذف..." : "Deleting...")}
                    </span>
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    <span>{t("btnDelete") || (isRTL ? "حذف" : "Delete")}</span>
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

export default DashboardProducts;
