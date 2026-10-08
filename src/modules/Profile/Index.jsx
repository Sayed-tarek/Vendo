import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiCamera,
  FiHome,
  FiLogOut,
  FiAlertCircle,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiHeart,
  FiKey,
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiPackage,
} from "react-icons/fi";
import { getProfile, updateProfile } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getCart, getWishlist } from "@/modules/Products/utils/storefrontState";
import MyOrders from "./components/MyOrders";
import "./Profile.css";

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();

  // URL search params to drive tabs seamlessly (?tab=orders / ?tab=profile)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "orders" ? "orders" : "profile";

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [serverError, setServerError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [totalOrdersCount, setTotalOrdersCount] = useState(null);

  // Live cart and wishlist counts
  const [cartCount, setCartCount] = useState(() => getCart().length);
  const [wishlistCount, setWishlistCount] = useState(() => getWishlist().length);

  useEffect(() => {
    const handleCartSync = () => setCartCount(getCart().length);
    const handleWishlistSync = () => setWishlistCount(getWishlist().length);
    window.addEventListener("vendo_cart_updated", handleCartSync);
    window.addEventListener("vendo_wishlist_updated", handleWishlistSync);
    return () => {
      window.removeEventListener("vendo_cart_updated", handleCartSync);
      window.removeEventListener("vendo_wishlist_updated", handleWishlistSync);
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  });

  // Fetch current profile on mount
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await getProfile();
        if (response && response.data && isMounted) {
          const data = response.data;
          setProfileData(data);
          updateUser(data);
          reset({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
        if (error.response?.status === 401) {
          toast.error(isRTL ? "انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى." : "Session expired, please log in again.");
          await logout();
          navigate("/login");
        } else {
          setServerError(isRTL ? "تعذر تحميل بيانات الملف الشخصي، يرجى المحاولة لاحقاً." : "Failed to load profile data.");
          toast.error(isRTL ? "تعذر تحميل بيانات الملف الشخصي" : "Failed to load profile data");
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [reset, updateUser, logout, navigate, isRTL]);

  // Handle local image file selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(isRTL ? "يجب اختيار ملف صورة صالح" : "Please select a valid image file");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Cancel edit mode and revert changes
  const handleCancelEdit = () => {
    setIsEditing(false);
    reset({
      name: profileData?.name || "",
      email: profileData?.email || "",
      phone: profileData?.phone || "",
    });
    setSelectedImage(null);
    setPreviewUrl(null);
    setServerError("");
  };

  const onSubmit = async (data) => {
    setServerError("");

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);

    // Only append image if the user selected a new file
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const updateResponse = await updateProfile(formData);
      console.log("Update Profile Response:", updateResponse);

      toast.success(isRTL ? "تم تحديث البيانات بنجاح" : "Profile updated successfully");
      setIsEditing(false);

      // Re-fetch profile to display latest confirmed data from server
      const freshProfile = await getProfile();
      if (freshProfile && freshProfile.data) {
        setProfileData(freshProfile.data);
        updateUser(freshProfile.data);
        reset({
          name: freshProfile.data.name,
          email: freshProfile.data.email,
          phone: freshProfile.data.phone,
        });
        setSelectedImage(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Update profile error:", error);

      if (error.response) {
        if (error.response.status === 401) {
          toast.error(isRTL ? "انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى." : "Session expired, please log in again.");
          await logout();
          navigate("/login");
          return;
        }

        const responseData = error.response.data;

        // Validation errors
        if (responseData && responseData.errors) {
          Object.keys(responseData.errors).forEach((field) => {
            const messages = responseData.errors[field];
            const errorMessage = Array.isArray(messages) ? messages[0] : messages;
            setError(field, {
              type: "server",
              message: errorMessage,
            });
          });
        }

        const message =
          responseData?.message || (isRTL ? "حدث خطأ أثناء تحديث البيانات، يرجى مراجعة الحقول." : "An error occurred while updating profile.");
        setServerError(message);
        toast.error(message);
      } else if (error.request) {
        const netMsg = isRTL ? "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت." : "Network error, please check connection.";
        setServerError(netMsg);
        toast.error(netMsg);
      } else {
        const genMsg = error.message || (isRTL ? "حدث خطأ غير متوقع." : "An unexpected error occurred.");
        setServerError(genMsg);
        toast.error(genMsg);
      }
    }
  };

  if (loadingProfile) {
    return (
      <div className="profile-loading-wrapper">
        <div className="profile-page-spinner" />
        <p className="profile-loading-text">
          {isRTL ? "جاري تحميل بيانات الملف الشخصي..." : "Loading profile..."}
        </p>
      </div>
    );
  }

  const currentDisplayImage = previewUrl || profileData?.image || user?.image;
  const isAdmin = profileData?.role === "admin" || user?.role === "admin";
  const isAccountActive = profileData?.status !== false && profileData?.status !== 0 && profileData?.status !== "0";

  return (
    <div className="vendo-profile-viewport">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="profile-main-container">
        {/* Breadcrumb Navigation */}
        <div className="profile-breadcrumb">
          <Link to="/" className="breadcrumb-link">
            <FiHome className="breadcrumb-icon" />
            <span>{isRTL ? "الرئيسية" : "Home"}</span>
          </Link>
          <span className="breadcrumb-separator">{isRTL ? <FiChevronLeft /> : <FiChevronRight />}</span>
          <span className="breadcrumb-current">
            {activeTab === "orders"
              ? (isRTL ? "طلباتي" : "My Orders")
              : (isRTL ? "الملف الشخصي" : "My Profile")}
          </span>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div className="profile-alert-error" role="alert">
            <FiAlertCircle className="profile-alert-icon" />
            <div className="profile-alert-text">
              <strong>{isRTL ? "تنبيه:" : "Notice:"}</strong> {serverError}
            </div>
          </div>
        )}

        {/* ========================================================
            1. Hero Header Banner Profile Card
            ======================================================== */}
        <div className="profile-hero-card">
          <div className="profile-hero-backdrop" />

          <div className="profile-hero-content">
            {/* User Avatar with status dot and edit camera overlay */}
            <div className="profile-avatar-box">
              <div className="profile-avatar-circle">
                {currentDisplayImage ? (
                  <img
                    src={currentDisplayImage}
                    alt={profileData?.name || "User Avatar"}
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    <FiUser />
                  </div>
                )}

                {/* Status Dot */}
                <span
                  className={`avatar-status-dot ${isAccountActive ? "active" : "inactive"}`}
                  title={isAccountActive ? (isRTL ? "حساب نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}
                />
              </div>

              {/* In Edit Mode: Camera Change Badge */}
              {isEditing && (
                <div className="avatar-camera-overlay">
                  <label htmlFor="profile-image-upload" className="btn-camera-upload" title={isRTL ? "تغيير الصورة" : "Change photo"}>
                    <FiCamera />
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden-file-input"
                    disabled={isSubmitting}
                    onChange={handleImageChange}
                  />
                </div>
              )}
            </div>

            {/* Profile Info Details in Hero */}
            <div className="profile-hero-meta">
              <div className="hero-meta-header">
                <h1 className="profile-hero-name">
                  {profileData?.name || user?.name || (isRTL ? "مستخدم Vendo" : "Vendo User")}
                </h1>
                <div className="hero-badges-row">
                  <span className={`hero-badge ${isAdmin ? "badge-admin" : "badge-customer"}`}>
                    <FiShield />
                    <span>{isAdmin ? (isRTL ? "مدير النظام" : "Administrator") : (isRTL ? "عميل معتمد" : "Verified Customer")}</span>
                  </span>

                  <span className={`hero-badge ${isAccountActive ? "badge-active" : "badge-inactive"}`}>
                    <span className="badge-dot" />
                    <span>{isAccountActive ? (isRTL ? "الحساب نشط" : "Active Account") : (isRTL ? "الحساب غير نشط" : "Inactive Account")}</span>
                  </span>
                </div>
              </div>

              <p className="profile-hero-email">
                <FiMail className="hero-email-icon" />
                <span>{profileData?.email || user?.email || "—"}</span>
              </p>

              {selectedImage && isEditing && (
                <div className="avatar-selected-note">
                  <FiCheckCircle />
                  <span>{isRTL ? `تم اختيار: ${selectedImage.name} (سيتم حفظها عند تأكيد التعديل)` : `Selected: ${selectedImage.name}`}</span>
                </div>
              )}
            </div>

            {/* Quick Hero Header Action Buttons */}
            <div className="profile-hero-actions">
              {isEditing ? (
                <div className="hero-action-buttons-group">
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="btn-hero-save"
                    id="btn-hero-save"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="profile-spinner" />
                        <span>{isRTL ? "جاري الحفظ..." : "Saving..."}</span>
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        <span>{isRTL ? "حفظ التعديلات" : "Save Changes"}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="btn-hero-cancel"
                    id="btn-hero-cancel"
                  >
                    <FiX />
                    <span>{isRTL ? "إلغاء" : "Cancel"}</span>
                  </button>
                </div>
              ) : activeTab === "orders" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleTabChange("profile");
                    setIsEditing(true);
                  }}
                  className="btn-hero-edit"
                  id="btn-hero-edit-from-orders"
                >
                  <FiEdit2 />
                  <span>{isRTL ? "تعديل البيانات" : "Edit Profile"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-hero-edit"
                  id="btn-hero-edit"
                >
                  <FiEdit2 />
                  <span>{isRTL ? "تعديل البيانات" : "Edit Profile"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            2. Quick Statistics and Overview Cards
            ======================================================== */}
        <div className="profile-stats-grid">
          {/* My Orders Quick Card */}
          <button
            type="button"
            onClick={() => handleTabChange("orders")}
            className={`stat-card stat-orders ${activeTab === "orders" ? "active-stat" : ""}`}
            style={{ cursor: "pointer", border: "none", textAlign: "inherit", font: "inherit" }}
          >
            <div className="stat-icon-wrapper orders-icon" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}>
              <FiPackage />
            </div>
            <div className="stat-content">
              <span className="stat-label">{isRTL ? "طلباتي" : "My Orders"}</span>
              <span className="stat-value">
                {totalOrdersCount !== null
                  ? `${totalOrdersCount} ${
                      isRTL
                        ? totalOrdersCount === 1
                          ? "طلب"
                          : totalOrdersCount === 2
                          ? "طلبان"
                          : totalOrdersCount <= 10
                          ? "طلبات"
                          : "طلب"
                        : totalOrdersCount === 1
                        ? "order"
                        : "orders"
                    }`
                  : (isRTL ? "عرض الطلبات" : "View Orders")}
              </span>
            </div>
          </button>

          <Link to="/cart" className="stat-card stat-cart">
            <div className="stat-icon-wrapper cart-icon">
              <FiShoppingCart />
            </div>
            <div className="stat-content">
              <span className="stat-label">{isRTL ? "سلة التسوق" : "Shopping Cart"}</span>
              <span className="stat-value">{cartCount} {isRTL ? "منتج" : "items"}</span>
            </div>
          </Link>

          <Link to="/wishlist" className="stat-card stat-wishlist">
            <div className="stat-icon-wrapper wishlist-icon">
              <FiHeart />
            </div>
            <div className="stat-content">
              <span className="stat-label">{isRTL ? "قائمة المفضلة" : "Wishlist"}</span>
              <span className="stat-value">{wishlistCount} {isRTL ? "منتج" : "items"}</span>
            </div>
          </Link>

          {isAdmin ? (
            <Link to="/dashboard" className="stat-card stat-dashboard">
              <div className="stat-icon-wrapper dashboard-icon">
                <FiGrid />
              </div>
              <div className="stat-content">
                <span className="stat-label">{isRTL ? "لوحة التحكم" : "Admin Panel"}</span>
                <span className="stat-value">{isRTL ? "إدارة المتجر" : "Manage Store"}</span>
              </div>
            </Link>
          ) : (
            <div className="stat-card stat-security">
              <div className="stat-icon-wrapper security-icon">
                <FiShield />
              </div>
              <div className="stat-content">
                <span className="stat-label">{isRTL ? "حماية الحساب" : "Security"}</span>
                <span className="stat-value">{isRTL ? "مؤمن وموثق" : "Protected"}</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            3. Navigation Tabs Bar (Personal Info vs My Orders)
            ======================================================== */}
        <div className="profile-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "profile"}
            onClick={() => handleTabChange("profile")}
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            id="tab-btn-profile"
          >
            <FiUser className="tab-btn-icon" aria-hidden="true" />
            <span>{isRTL ? "المعلومات الشخصية" : "Personal Information"}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "orders"}
            onClick={() => handleTabChange("orders")}
            className={`profile-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            id="tab-btn-orders"
          >
            <FiPackage className="tab-btn-icon" aria-hidden="true" />
            <span>{isRTL ? "طلباتي" : "My Orders"}</span>
            {totalOrdersCount !== null && (
              <span className="tab-badge" aria-label={`${totalOrdersCount} orders`}>
                {totalOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================
            4. Tab Content Panels
            ======================================================== */}
        {activeTab === "orders" ? (
          /* TAB 2: My Orders Section */
          <div className="profile-orders-tab-content">
            <MyOrders onTotalOrdersLoaded={setTotalOrdersCount} />
          </div>
        ) : (
          /* TAB 1: Personal Info & Security (2-Column Grid) */
          <div className="profile-layout-grid">
            {/* Main Column: Personal Details / Form */}
            <div className="profile-main-column">
              <div className="profile-card-box">
                <div className="card-box-header">
                  <div className="card-box-title-wrap">
                    <FiUser className="card-box-header-icon" />
                    <div>
                      <h2 className="card-box-title">
                        {isRTL ? "المعلومات الشخصية" : "Personal Information"}
                      </h2>
                      <p className="card-box-subtitle">
                        {isEditing
                          ? (isRTL ? "قم بتعديل بياناتك ثم اضغط على حفظ التعديلات" : "Edit your personal details and save changes")
                          : (isRTL ? "البيانات الأساسية المسجلة في حسابك على Vendo" : "Your registered account details on Vendo")}
                      </p>
                    </div>
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn-card-edit"
                      id="btn-edit-personal-info"
                    >
                      <FiEdit2 />
                      <span>{isRTL ? "تعديل" : "Edit"}</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  /* Edit Mode: Form Inputs */
                  <form onSubmit={handleSubmit(onSubmit)} className="profile-edit-form" noValidate>
                    {/* Full Name */}
                    <div className="form-field-group">
                      <label className="field-label" htmlFor="name">
                        {isRTL ? "الاسم الكامل" : "Full Name"}
                        <span className="required-star">*</span>
                      </label>
                      <div className="field-input-wrap">
                        <FiUser className="field-prefix-icon" />
                        <input
                          id="name"
                          type="text"
                          className={`field-input ${errors.name ? "has-error" : ""}`}
                          placeholder={isRTL ? "أدخل اسمك الكامل" : "Enter your full name"}
                          disabled={isSubmitting}
                          {...register("name", {
                            required: isRTL ? "الاسم مطلوب" : "Name is required",
                          })}
                        />
                      </div>
                      {errors.name && (
                        <span className="field-error-msg">
                          <FiAlertCircle />
                          <span>{errors.name.message}</span>
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="form-field-group">
                      <label className="field-label" htmlFor="email">
                        {isRTL ? "البريد الإلكتروني" : "Email Address"}
                        <span className="required-star">*</span>
                      </label>
                      <div className="field-input-wrap">
                        <FiMail className="field-prefix-icon" />
                        <input
                          id="email"
                          type="email"
                          dir="ltr"
                          className={`field-input ${errors.email ? "has-error" : ""}`}
                          placeholder="example@domain.com"
                          disabled={isSubmitting}
                          {...register("email", {
                            required: isRTL ? "البريد الإلكتروني مطلوب" : "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: isRTL ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format",
                            },
                          })}
                        />
                      </div>
                      {errors.email && (
                        <span className="field-error-msg">
                          <FiAlertCircle />
                          <span>{errors.email.message}</span>
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="form-field-group">
                      <label className="field-label" htmlFor="phone">
                        {isRTL ? "رقم الهاتف" : "Phone Number"}
                        <span className="required-star">*</span>
                      </label>
                      <div className="field-input-wrap">
                        <FiPhone className="field-prefix-icon" />
                        <input
                          id="phone"
                          type="tel"
                          dir="ltr"
                          className={`field-input ${errors.phone ? "has-error" : ""}`}
                          placeholder="01xxxxxxxxx"
                          disabled={isSubmitting}
                          {...register("phone", {
                            required: isRTL ? "رقم الهاتف مطلوب" : "Phone number is required",
                          })}
                        />
                      </div>
                      {errors.phone && (
                        <span className="field-error-msg">
                          <FiAlertCircle />
                          <span>{errors.phone.message}</span>
                        </span>
                      )}
                    </div>

                    {/* Form Actions in Edit Mode */}
                    <div className="form-bottom-actions">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-form-save"
                        id="btn-save-personal-form"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="profile-spinner" />
                            <span>{isRTL ? "جاري الحفظ..." : "Saving..."}</span>
                          </>
                        ) : (
                          <>
                            <FiCheck />
                            <span>{isRTL ? "حفظ التعديلات" : "Save Changes"}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleCancelEdit}
                        className="btn-form-cancel"
                        id="btn-cancel-personal-form"
                      >
                        <FiX />
                        <span>{isRTL ? "إلغاء التعديل" : "Cancel"}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode: Clean, Aesthetic Info Rows */
                  <div className="profile-info-display-list">
                    <div className="info-display-item">
                      <div className="info-item-leading">
                        <div className="info-icon-box">
                          <FiUser />
                        </div>
                        <div>
                          <span className="info-item-label">{isRTL ? "الاسم الكامل" : "Full Name"}</span>
                          <h3 className="info-item-value">{profileData?.name || "—"}</h3>
                        </div>
                      </div>
                      <span className="info-item-badge">
                        <FiCheckCircle />
                        <span>{isRTL ? "الاسم الرسمي" : "Official"}</span>
                      </span>
                    </div>

                    <div className="info-display-item">
                      <div className="info-item-leading">
                        <div className="info-icon-box">
                          <FiMail />
                        </div>
                        <div>
                          <span className="info-item-label">{isRTL ? "البريد الإلكتروني" : "Email Address"}</span>
                          <h3 className="info-item-value" dir="ltr">{profileData?.email || "—"}</h3>
                        </div>
                      </div>
                      <span className="info-item-badge verified">
                        <FiCheckCircle />
                        <span>{isRTL ? "مؤكد" : "Verified"}</span>
                      </span>
                    </div>

                    <div className="info-display-item">
                      <div className="info-item-leading">
                        <div className="info-icon-box">
                          <FiPhone />
                        </div>
                        <div>
                          <span className="info-item-label">{isRTL ? "رقم الهاتف للتواصل" : "Phone Number"}</span>
                          <h3 className="info-item-value" dir="ltr">{profileData?.phone || "—"}</h3>
                        </div>
                      </div>
                      <span className="info-item-badge">
                        <FiCheckCircle />
                        <span>{isRTL ? "نشط" : "Active"}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Column: Account Security & Quick Management */}
            <div className="profile-sidebar-column">
              {/* Security Card */}
              <div className="profile-card-box">
                <div className="card-box-header">
                  <div className="card-box-title-wrap">
                    <FiKey className="card-box-header-icon" />
                    <div>
                      <h2 className="card-box-title">{isRTL ? "الأمان وكلمة المرور" : "Security & Password"}</h2>
                      <p className="card-box-subtitle">{isRTL ? "إدارة إعدادات الدخول والحماية" : "Account access and credentials"}</p>
                    </div>
                  </div>
                </div>

                <div className="security-info-block">
                  <div className="security-row">
                    <div>
                      <span className="security-label">{isRTL ? "كلمة المرور" : "Password"}</span>
                      <span className="security-dots">••••••••••••••</span>
                    </div>
                    <Link to="/forgot-password" className="btn-security-action">
                      <span>{isRTL ? "إعادة تعيين" : "Reset"}</span>
                    </Link>
                  </div>

                  <div className="security-guarantee-note">
                    <FiShield className="guarantee-icon" />
                    <span>
                      {isRTL
                        ? "بياناتك مشفرة ومحمية وفق أعلى معايير أمان المتاجر الإلكترونية."
                        : "Your data is securely encrypted according to modern standards."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session & Navigation Quick Links Card */}
              <div className="profile-card-box">
                <div className="card-box-header">
                  <div className="card-box-title-wrap">
                    <FiShoppingBag className="card-box-header-icon" />
                    <div>
                      <h2 className="card-box-title">{isRTL ? "روابط سريعة" : "Quick Links"}</h2>
                      <p className="card-box-subtitle">{isRTL ? "التنقل في المتجر وإدارة الحساب" : "Store shortcuts and session"}</p>
                    </div>
                  </div>
                </div>

                <div className="profile-quick-links-list">
                  {/* Switch to My Orders */}
                  <button
                    type="button"
                    onClick={() => handleTabChange("orders")}
                    className="quick-link-item"
                    id="quick-link-orders"
                  >
                    <div className="quick-link-left">
                      <FiPackage className="quick-link-icon" />
                      <span>{isRTL ? "متابعة طلباتي" : "My Orders"}</span>
                    </div>
                    {totalOrdersCount !== null ? (
                      <span className="quick-link-count">{totalOrdersCount}</span>
                    ) : (
                      <span className="quick-link-arrow">{isRTL ? <FiChevronLeft /> : <FiChevronRight />}</span>
                    )}
                  </button>

                  <Link to="/shop" className="quick-link-item">
                    <div className="quick-link-left">
                      <FiShoppingBag className="quick-link-icon" />
                      <span>{isRTL ? "تصفح كافة المنتجات" : "Browse Products"}</span>
                    </div>
                    <span className="quick-link-arrow">{isRTL ? <FiChevronLeft /> : <FiChevronRight />}</span>
                  </Link>

                  <Link to="/cart" className="quick-link-item">
                    <div className="quick-link-left">
                      <FiShoppingCart className="quick-link-icon" />
                      <span>{isRTL ? "عربة التسوق" : "Shopping Cart"}</span>
                    </div>
                    <span className="quick-link-count">{cartCount}</span>
                  </Link>

                  <Link to="/wishlist" className="quick-link-item">
                    <div className="quick-link-left">
                      <FiHeart className="quick-link-icon" />
                      <span>{isRTL ? "قائمة المنتجات المفضلة" : "Wishlist"}</span>
                    </div>
                    <span className="quick-link-count">{wishlistCount}</span>
                  </Link>

                  {isAdmin && (
                    <Link to="/dashboard" className="quick-link-item dashboard-item">
                      <div className="quick-link-left">
                        <FiGrid className="quick-link-icon" />
                        <span>{isRTL ? "لوحة تحكم الإدارة" : "Admin Dashboard"}</span>
                      </div>
                      <span className="quick-link-badge">{isRTL ? "مدير" : "Admin"}</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      toast.success(isRTL ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
                      navigate("/login");
                    }}
                    className="quick-link-item logout-item"
                    id="btn-logout-sidebar"
                  >
                    <div className="quick-link-left">
                      <FiLogOut className="quick-link-icon" />
                      <span>{isRTL ? "تسجيل الخروج من الحساب" : "Log Out"}</span>
                    </div>
                    <span className="quick-link-arrow">{isRTL ? <FiChevronLeft /> : <FiChevronRight />}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
