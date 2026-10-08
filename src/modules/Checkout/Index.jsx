import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiMapPin,
  FiPhone,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiPackage,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getCart, clearCart } from "@/modules/Products/utils/storefrontState";
import { createOrder } from "@/services/orderService";
import { EGYPTIAN_GOVERNORATES } from "./data/governorates";
import "./Checkout.css";

export function CheckoutPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect guest users to /login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Cart state
  const [cart, setCart] = useState(() => getCart());

  // Listen to cart updates
  useEffect(() => {
    const handleCartSync = () => {
      setCart(getCart());
    };
    window.addEventListener("vendo_cart_updated", handleCartSync);
    return () => window.removeEventListener("vendo_cart_updated", handleCartSync);
  }, []);

  // Form state - prefill phone from auth user reactively without cascading effects
  const [manualPhone, setManualPhone] = useState(null);
  const deliveryPhone = manualPhone !== null ? manualPhone : (user?.phone || "");

  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  // Validation & Submission state
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Business calculations
  const fixedShipping = 50;
  const subtotal = cart.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return acc + price * qty;
  }, 0);
  const total = subtotal + fixedShipping;

  // Validation handler
  const validateForm = () => {
    const newErrors = {};

    if (!deliveryPhone || !deliveryPhone.trim()) {
      newErrors.delivery_phone =
        t("phoneRequired") || (isRTL ? "يرجى إدخال رقم الهاتف للتوصيل" : "Please enter delivery phone number");
    }

    if (!governorate || !governorate.trim()) {
      newErrors.governorate =
        t("governorateRequired") || (isRTL ? "يرجى اختيار المحافظة" : "Please select governorate");
    }

    if (!address || !address.trim()) {
      newErrors.address =
        t("addressRequired") || (isRTL ? "يرجى إدخال عنوان التوصيل" : "Please enter delivery address");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      toast.error(isRTL ? "يرجى استكمال البيانات المطلوبة" : "Please complete required fields");
      return;
    }

    if (cart.length === 0) {
      toast.error(t("emptyCartTitle") || (isRTL ? "السلة فارغة" : "Cart is empty"));
      return;
    }

    setIsSubmitting(true);

    // Build items contract
    const items = cart.map((item) => {
      const itemPayload = {
        product_id: Number(item.id),
        quantity: Number(item.quantity) || 1,
      };
      if (item.variant?.id) {
        itemPayload.product_variant_id = Number(item.variant.id);
      }
      return itemPayload;
    });

    const payload = {
      items,
      governorate,
      address: address.trim(),
      delivery_phone: deliveryPhone.trim(),
      shipping: fixedShipping,
    };

    if (note && note.trim()) {
      payload.note = note.trim();
    }

    try {
      const response = await createOrder(payload);
      console.log("Create Order Response:", response);

      // 1. Success notification
      toast.success(t("orderCreatedSuccess") || (isRTL ? "تم إنشاء الطلب بنجاح" : "Order created successfully"));

      // 2. Clear cart ONLY after order creation success
      clearCart();

      // 3. Navigate to success page
      const createdOrder = response?.data || response;
      const orderNumber = createdOrder?.order_number || createdOrder?.id || null;

      navigate("/order-success", {
        state: {
          order: createdOrder,
          orderNumber,
        },
        replace: true,
      });
    } catch (error) {
      console.error("Order creation failed:", error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          toast.error(t("sessionExpired") || (isRTL ? "انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى." : "Session expired, please log in again."));
          logout();
          navigate("/login", { state: { from: location } });
          return;
        }

        if (status === 422) {
          if (data?.errors) {
            const backendErrors = {};
            Object.keys(data.errors).forEach((key) => {
              const msg = Array.isArray(data.errors[key]) ? data.errors[key][0] : data.errors[key];
              backendErrors[key] = msg;
            });
            setErrors((prev) => ({ ...prev, ...backendErrors }));
          }
          const msg = data?.message || (isRTL ? "يرجى التحقق من صحة البيانات المدخلة" : "Please verify the entered information");
          setServerError(msg);
          toast.error(msg);
        } else if (status === 409 || (data?.message && (data.message.includes("المخزون") || data.message.includes("الكمية") || data.message.includes("stock")))) {
          const msg = data?.message || (isRTL ? "الكمية المطلوبة غير متوفرة في المخزون" : "Requested quantity is not available in stock");
          setServerError(msg);
          toast.error(msg);
        } else {
          const msg = data?.message || (isRTL ? "حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى" : "An error occurred while creating order. Please try again.");
          setServerError(msg);
          toast.error(msg);
        }
      } else {
        const netMsg = isRTL ? "تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت" : "Network error, please check your internet connection.";
        setServerError(netMsg);
        toast.error(netMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Empty Cart State
  // -------------------------------------------------------------------------
  if (cart.length === 0) {
    return (
      <div className="vendo-checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty-state">
            <div className="empty-state-icon">
              <FiShoppingBag />
            </div>
            <h2 className="empty-state-title">{t("emptyCartTitle") || (isRTL ? "السلة فارغة" : "Empty Cart")}</h2>
            <p className="empty-state-desc">
              {t("emptyCartDesc") ||
                (isRTL
                  ? "عربة التسوق فارغة حالياً، أضف بعض المنتجات للمتابعة إلى إتمام الطلب."
                  : "Your shopping cart is currently empty. Add products to proceed to checkout.")}
            </p>
            <Link to="/shop" className="btn-continue-shopping">
              <span>{t("continueShopping") || (isRTL ? "متابعة التسوق" : "Continue Shopping")}</span>
              {isRTL ? <FiArrowLeft /> : <FiArrowRight />}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Checkout Form & Review Page
  // -------------------------------------------------------------------------
  return (
    <div className="vendo-checkout-page">
      <div className="checkout-container">
        {/* Page Header */}
        <div className="checkout-header">
          <h1 className="checkout-header-title">
            <span className="checkout-header-icon">
              <FiTruck />
            </span>
            {t("checkoutTitle") || (isRTL ? "إتمام الطلب" : "Checkout")}
          </h1>
          <p className="checkout-header-desc">
            {isRTL
              ? "يرجى مراجعة بيانات التوصيل وعناصر طلبك قبل التأكيد النهائي."
              : "Please review your delivery details and order items before confirmation."}
          </p>
        </div>

        {/* Global Server Error Banner if any */}
        {serverError && (
          <div className="checkout-alert-error" role="alert">
            <FiAlertCircle className="checkout-alert-icon" />
            <div>
              <strong>{isRTL ? "تنبيه:" : "Notice:"}</strong> {serverError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} noValidate className="checkout-form">
          <div className="checkout-grid">
            {/* Left / Main Column: Delivery & Customer Info */}
            <div className="checkout-form-column">
              {/* Customer Information (Read-Only) */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <FiUser className="card-header-icon" />
                  <h2 className="checkout-card-title">
                    {t("customerInfo") || (isRTL ? "بيانات العميل" : "Customer Information")}
                  </h2>
                </div>
                <div className="customer-info-box">
                  <div className="customer-info-item">
                    <span className="customer-info-label">{t("clientName") || (isRTL ? "اسم العميل" : "Name")}</span>
                    <span className="customer-info-value">{user?.name || (isRTL ? "عميل مسجل" : "Registered User")}</span>
                  </div>
                  <div className="customer-info-item">
                    <span className="customer-info-label">{t("clientEmail") || (isRTL ? "البريد الإلكتروني" : "Email")}</span>
                    <span className="customer-info-value">{user?.email || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information (Form) */}
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <FiMapPin className="card-header-icon" />
                  <h2 className="checkout-card-title">
                    {t("deliveryInfo") || (isRTL ? "بيانات التوصيل" : "Delivery Information")}
                  </h2>
                </div>

                {/* Delivery Phone */}
                <div className="checkout-form-group">
                  <label htmlFor="delivery_phone" className="checkout-label">
                    {t("deliveryPhone") || (isRTL ? "رقم هاتف التوصيل" : "Delivery Phone")}
                    <span className="required-mark">*</span>
                  </label>
                  <div className="phone-input-wrap">
                    <FiPhone className="phone-icon" />
                    <input
                      id="delivery_phone"
                      name="delivery_phone"
                      type="tel"
                      dir="ltr"
                      className={`checkout-input ${errors.delivery_phone ? "input-error" : ""}`}
                      value={deliveryPhone}
                      onChange={(e) => {
                        setManualPhone(e.target.value);
                        if (errors.delivery_phone) {
                          setErrors((prev) => ({ ...prev, delivery_phone: null }));
                        }
                      }}
                      placeholder="01xxxxxxxxx"
                      aria-required="true"
                      aria-invalid={Boolean(errors.delivery_phone)}
                    />
                  </div>
                  {errors.delivery_phone && (
                    <div className="checkout-error-text">
                      <FiAlertCircle />
                      <span>{errors.delivery_phone}</span>
                    </div>
                  )}
                </div>

                {/* Governorate Select */}
                <div className="checkout-form-group">
                  <label htmlFor="governorate" className="checkout-label">
                    {t("governorate") || (isRTL ? "المحافظة" : "Governorate")}
                    <span className="required-mark">*</span>
                  </label>
                  <select
                    id="governorate"
                    name="governorate"
                    className={`checkout-select ${errors.governorate ? "input-error" : ""}`}
                    value={governorate}
                    onChange={(e) => {
                      setGovernorate(e.target.value);
                      if (errors.governorate) {
                        setErrors((prev) => ({ ...prev, governorate: null }));
                      }
                    }}
                    aria-required="true"
                    aria-invalid={Boolean(errors.governorate)}
                  >
                    <option value="">
                      {t("selectGovernorate") || (isRTL ? "— اختر المحافظة —" : "— Select Governorate —")}
                    </option>
                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.name_en}>
                        {isRTL ? gov.name_ar : gov.name_en}
                      </option>
                    ))}
                  </select>
                  {errors.governorate && (
                    <div className="checkout-error-text">
                      <FiAlertCircle />
                      <span>{errors.governorate}</span>
                    </div>
                  )}
                </div>

                {/* Address Textarea */}
                <div className="checkout-form-group">
                  <label htmlFor="address" className="checkout-label">
                    {t("address") || (isRTL ? "العنوان بالتفصيل" : "Detailed Address")}
                    <span className="required-mark">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    className={`checkout-textarea ${errors.address ? "input-error" : ""}`}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) {
                        setErrors((prev) => ({ ...prev, address: null }));
                      }
                    }}
                    placeholder={
                      t("addressPlaceholder") ||
                      (isRTL ? "الشارع، رقم المبنى، الحي، تفاصيل العنوان..." : "Street, building number, area, address details...")
                    }
                    aria-required="true"
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address && (
                    <div className="checkout-error-text">
                      <FiAlertCircle />
                      <span>{errors.address}</span>
                    </div>
                  )}
                </div>

                {/* Order Notes (Optional) */}
                <div className="checkout-form-group">
                  <label htmlFor="note" className="checkout-label">
                    {t("orderNotes") || (isRTL ? "ملاحظات الطلب (اختياري)" : "Order Notes (Optional)")}
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={2}
                    className="checkout-textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      t("orderNotesPlaceholder") ||
                      (isRTL ? "أي ملاحظات إضافية لتوصيل الطلب..." : "Any additional notes for delivery...")
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right / Sidebar Column: Order Summary & Review */}
            <div className="order-summary-sidebar">
              <div className="checkout-card">
                <div className="checkout-card-header">
                  <FiPackage className="card-header-icon" />
                  <h2 className="checkout-card-title">
                    {t("orderSummary") || (isRTL ? "ملخص الطلب" : "Order Summary")}
                  </h2>
                </div>

                {/* Items Review List */}
                <div className="checkout-items-list">
                  {cart.map((item) => {
                    const itemName = isRTL ? item.name_ar || item.name_en : item.name_en || item.name_ar;
                    const itemPrice = Number(item.price) || 0;
                    const itemQuantity = Number(item.quantity) || 1;
                    const itemTotal = itemPrice * itemQuantity;

                    return (
                      <div key={item.cartItemId} className="checkout-item">
                        <div className="checkout-item-img-wrap">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={itemName}
                              className="checkout-item-img"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = '<span class="checkout-item-placeholder">🛍️</span>';
                              }}
                            />
                          ) : (
                            <span className="checkout-item-placeholder">🛍️</span>
                          )}
                        </div>

                        <div className="checkout-item-details">
                          <h4 className="checkout-item-name" title={itemName}>
                            {itemName}
                          </h4>

                          {item.variant && (
                            <div className="checkout-item-variant">
                              {item.variant.color && (
                                <span className="variant-tag">
                                  {item.variant.color.code && (
                                    <span
                                      className="variant-color-dot"
                                      style={{ backgroundColor: item.variant.color.code }}
                                    />
                                  )}
                                  <span>
                                    {isRTL
                                      ? item.variant.color.name_ar || item.variant.color.name_en
                                      : item.variant.color.name_en || item.variant.color.name_ar}
                                  </span>
                                </span>
                              )}
                              {item.variant.size && (
                                <span className="variant-tag">
                                  <span>{item.variant.size.name}</span>
                                </span>
                              )}
                            </div>
                          )}

                          <div className="checkout-item-pricing">
                            <span>{itemPrice.toLocaleString()} {t("currencySymbol") || "ج.م"}</span>
                            {" × "}
                            <strong>{itemQuantity}</strong>
                          </div>
                        </div>

                        <div className="checkout-item-total">
                          {itemTotal.toLocaleString()} {t("currencySymbol") || "ج.م"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="pricing-breakdown">
                  <div className="pricing-row">
                    <span>{t("subtotal") || (isRTL ? "الإجمالي الفرعي" : "Subtotal")}</span>
                    <span className="price-val">
                      {subtotal.toLocaleString()} {t("currencySymbol") || "ج.م"}
                    </span>
                  </div>

                  <div className="pricing-row">
                    <span>{t("shipping") || (isRTL ? "الشحن" : "Shipping")}</span>
                    <span className="price-val">
                      {fixedShipping} {t("currencySymbol") || "ج.م"}
                    </span>
                  </div>

                  <div className="shipping-note">
                    {t("shippingFixedNote") || (isRTL ? "شحن قياسي لكافة المحافظات" : "Standard delivery to all governorates")}
                  </div>

                  <div className="pricing-row total-row">
                    <span>{t("total") || (isRTL ? "الإجمالي الكلي" : "Total")}</span>
                    <span className="price-val">
                      {total.toLocaleString()} {t("currencySymbol") || "ج.م"}
                    </span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-confirm-order"
                  id="checkout-confirm-btn"
                >
                  {isSubmitting ? (
                    <>
                      <span className="checkout-spinner" aria-hidden="true" />
                      <span>{t("creatingOrder") || (isRTL ? "جاري إنشاء الطلب..." : "Creating Order...")}</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle aria-hidden="true" />
                      <span>{t("confirmOrder") || (isRTL ? "تأكيد الطلب" : "Confirm Order")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;
