import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiArrowRight,
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiCheckSquare,
  FiTruck,
  FiXCircle,
  FiHelpCircle,
  FiEdit2,
  FiX,
  FiAlertTriangle,
  FiLoader,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getDashboardOrderById,
  updateDashboardOrderStatus,
  ORDER_STATUSES,
} from "@/services/orderService";
import "./Categories.css";
import "./Orders.css";

// Metadata and visual configurations for all 6 statuses matching Rule::in([pending, confirmed, processing, shipped, delivered, cancelled])
const STATUS_CONFIGS = [
  {
    key: "pending",
    badgeClass: "badge-status-pending",
    icon: FiClock,
    dotColor: "#f59e0b",
    labelAr: "قيد الانتظار",
    labelEn: "Pending",
    descAr: "تم استلام الطلب وبانتظار المراجعة والتأكيد",
    descEn: "Order received, awaiting review",
  },
  {
    key: "confirmed",
    badgeClass: "badge-status-confirmed",
    icon: FiCheckSquare,
    dotColor: "#6366f1",
    labelAr: "مؤكد",
    labelEn: "Confirmed",
    descAr: "تمت مراجعة بيانات الطلب وتأكيده بنجاح",
    descEn: "Order confirmed and verified",
  },
  {
    key: "processing",
    badgeClass: "badge-status-processing",
    icon: FiRefreshCw,
    dotColor: "#3b82f6",
    labelAr: "قيد التجهيز",
    labelEn: "Processing",
    descAr: "جاري تجهيز وتعبئة المنتجات في المخزن",
    descEn: "Preparing and packing products",
  },
  {
    key: "shipped",
    badgeClass: "badge-status-shipped",
    icon: FiTruck,
    dotColor: "#06b6d4",
    labelAr: "تم الشحن",
    labelEn: "Shipped",
    descAr: "تم تسليم الشحنة لشركة الشحن والتوصيل",
    descEn: "Handed over to delivery carrier",
  },
  {
    key: "delivered",
    badgeClass: "badge-status-delivered",
    icon: FiCheckCircle,
    dotColor: "#10b981",
    labelAr: "تم التوصيل",
    labelEn: "Delivered",
    descAr: "تم تسليم الطلب للعميل بنجاح",
    descEn: "Successfully delivered to customer",
  },
  {
    key: "cancelled",
    badgeClass: "badge-status-cancelled",
    icon: FiXCircle,
    dotColor: "#ef4444",
    labelAr: "ملغي",
    labelEn: "Cancelled",
    descAr: "تم إلغاء الطلب ولن يتم شحنه للعميل",
    descEn: "Order has been cancelled",
  },
];

// Helper: Format order date and time
const formatDateTime = (dateStr, isRTL) => {
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

// Helper: Resolve status badge details with safe fallback
const getStatusBadge = (status, t, isRTL) => {
  const normalized = (status || "").toLowerCase().trim();
  const config = STATUS_CONFIGS.find(
    (c) => c.key === normalized || (normalized === "canceled" && c.key === "cancelled")
  );

  if (config) {
    const IconComponent = config.icon;
    const labelKey = `status${config.key.charAt(0).toUpperCase() + config.key.slice(1)}`;
    return {
      key: config.key,
      label: t(labelKey) || (isRTL ? config.labelAr : config.labelEn),
      className: config.badgeClass,
      dotColor: config.dotColor,
      icon: <IconComponent aria-hidden="true" />,
    };
  }

  return {
    key: status || "unknown",
    label: status || (t("statusUnknown") || (isRTL ? "غير معروف" : "Unknown")),
    className: "badge-status-unknown",
    dotColor: "#94a3b8",
    icon: <FiHelpCircle aria-hidden="true" />,
  };
};

export function DashboardOrderDetails() {
  const { id } = useParams();
  const { t, isRTL } = useTranslation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Status modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadOrder = async () => {
      if (!id) return;
      try {
        const response = await getDashboardOrderById(id);
        const orderData = response?.data || response;
        if (!ignore) {
          setOrder(orderData);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch order details error:", err);
          setError(
            err.response?.data?.message ||
              t("errorLoadingOrderDetails") ||
              (isRTL ? "تعذر تحميل تفاصيل الطلب" : "Failed to load order details")
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      ignore = true;
    };
  }, [id, retryTrigger, t, isRTL]);

  const handleRetry = () => {
    setLoading(true);
    setRetryTrigger((prev) => prev + 1);
  };

  // Open Status Edit Modal
  const handleOpenStatusModal = () => {
    if (!order) return;
    const current = (order?.status || "").toLowerCase().trim();
    const matched = ORDER_STATUSES.includes(current)
      ? current
      : current === "canceled"
      ? "cancelled"
      : "pending";

    setSelectedStatus(matched);
    setIsStatusModalOpen(true);
  };

  // Close Status Modal
  const handleCloseStatusModal = () => {
    if (isSubmittingStatus) return;
    setIsStatusModalOpen(false);
  };

  // Submit Status Update
  const handleSubmitStatus = async (e) => {
    if (e) e.preventDefault();
    if (!order || !selectedStatus || isSubmittingStatus) return;

    const current = (order.status || "").toLowerCase().trim();
    if (current === selectedStatus || (current === "canceled" && selectedStatus === "cancelled")) {
      handleCloseStatusModal();
      return;
    }

    setIsSubmittingStatus(true);
    try {
      // POST /dashboard/update/orders/{id}/status with payload: { "status": selectedStatus }
      await updateDashboardOrderStatus(order.id, selectedStatus);

      // Local update
      setOrder((prev) => (prev ? { ...prev, status: selectedStatus } : prev));

      const statusObj = STATUS_CONFIGS.find((c) => c.key === selectedStatus);
      const localizedLabel = isRTL ? statusObj?.labelAr : statusObj?.labelEn;

      toast.success(
        t("orderStatusUpdatedSuccess") ||
          (isRTL
            ? `تم تحديث حالة الطلب بنجاح إلى "${localizedLabel || selectedStatus}".`
            : `Order status updated successfully to "${localizedLabel || selectedStatus}".`)
      );

      setIsStatusModalOpen(false);
    } catch (err) {
      console.error("Order status update error:", err);
      const errMsg =
        err.response?.data?.message ||
        t("orderStatusUpdateFailed") ||
        (isRTL ? "تعذر تحديث حالة الطلب، يرجى المحاولة مرة أخرى." : "Failed to update order status.");
      toast.error(errMsg);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="order-details-page">
        <div className="details-nav-bar">
          <Link to="/dashboard/orders" className="btn-back-orders">
            {isRTL ? <FiArrowRight aria-hidden="true" /> : <FiArrowLeft aria-hidden="true" />}
            <span>{t("backToOrders") || (isRTL ? "العودة إلى الطلبات" : "Back to Orders")}</span>
          </Link>
        </div>

        <div className="order-header-banner" style={{ minHeight: "90px" }}>
          <div className="skeleton-row" style={{ width: "250px", height: "30px", marginBottom: "0.5rem" }} />
          <div className="skeleton-row" style={{ width: "120px", height: "24px" }} />
        </div>

        <div className="order-details-grid">
          <div className="order-info-card">
            <div className="skeleton-row" style={{ width: "100%", height: "120px" }} />
          </div>
          <div className="order-info-card">
            <div className="skeleton-row" style={{ width: "100%", height: "120px" }} />
          </div>
        </div>

        <div className="order-items-card">
          <div className="skeleton-row" style={{ width: "100%", height: "180px" }} />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="details-nav-bar">
          <Link to="/dashboard/orders" className="btn-back-orders">
            {isRTL ? <FiArrowRight aria-hidden="true" /> : <FiArrowLeft aria-hidden="true" />}
            <span>{t("backToOrders") || (isRTL ? "العودة إلى الطلبات" : "Back to Orders")}</span>
          </Link>
        </div>

        <div className="orders-state-box" role="alert">
          <div className="orders-state-icon error" aria-hidden="true">
            <FiAlertCircle />
          </div>
          <h2 className="orders-state-title">
            {t("errorLoadingOrderDetails") || (isRTL ? "تعذر تحميل تفاصيل الطلب" : "Failed to Load Order Details")}
          </h2>
          <p className="orders-state-desc">{error || (isRTL ? "الطلب غير موجود أو تعذر الوصول إليه." : "Order not found.")}</p>
          <button
            type="button"
            className="btn-orders-refresh"
            onClick={handleRetry}
            style={{ margin: "0 auto" }}
          >
            <FiRefreshCw aria-hidden="true" />
            <span>{t("retry") || (isRTL ? "إعادة المحاولة" : "Retry")}</span>
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.status, t, isRTL);
  const orderNum = order.order_number || `#${order.id}`;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="order-details-page">
      {/* Toast Notification Container */}
      <Toaster position={isRTL ? "top-left" : "top-right"} reverseOrder={false} />

      {/* Navigation Top Bar */}
      <div className="details-nav-bar">
        <Link to="/dashboard/orders" className="btn-back-orders">
          {isRTL ? <FiArrowRight aria-hidden="true" /> : <FiArrowLeft aria-hidden="true" />}
          <span>{t("backToOrders") || (isRTL ? "العودة إلى الطلبات" : "Back to Orders")}</span>
        </Link>
      </div>

      {/* Section 1: Order Header Banner */}
      <div className="order-header-banner">
        <div className="order-headline-box">
          <h1 className="order-headline-num">{orderNum}</h1>
          <div className="order-headline-date">
            <FiCalendar aria-hidden="true" />
            <span>{formatDateTime(order.created_at, isRTL)}</span>
          </div>
        </div>

        <div className="order-status-wrap" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            className="order-status-btn-cell"
            onClick={handleOpenStatusModal}
            title={t("updateOrderStatus") || (isRTL ? "انقر لتعديل حالة الطلب" : "Click to edit order status")}
          >
            <span
              className={`dash-order-status ${statusInfo.className}`}
              style={{ fontSize: "0.95rem", padding: "0.45rem 1.1rem" }}
            >
              <span className="status-dot" aria-hidden="true" />
              <span>{statusInfo.label}</span>
              <FiEdit2 className="status-edit-hint" aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className="btn-order-status-edit"
            onClick={handleOpenStatusModal}
            style={{ padding: "0.45rem 0.95rem", fontSize: "0.85rem" }}
            title={t("updateOrderStatus") || (isRTL ? "تعديل حالة الطلب" : "Update Status")}
          >
            <FiEdit2 aria-hidden="true" />
            <span>{t("changeStatus") || (isRTL ? "تعديل الحالة" : "Change Status")}</span>
          </button>
        </div>
      </div>

      {/* Section 2 & 3: Customer and Delivery Information Grid */}
      <div className="order-details-grid">
        {/* Customer Information Card */}
        <div className="order-info-card">
          <div className="order-info-card-header">
            <FiUser className="order-info-card-icon" aria-hidden="true" />
            <h3>{t("customerInfo") || (isRTL ? "بيانات العميل" : "Customer Information")}</h3>
          </div>
          <div className="info-fields-list">
            <div className="info-field-row">
              <span className="info-field-label">{t("customerName") || (isRTL ? "الاسم" : "Name")}</span>
              <span className="info-field-value">{order.user?.name || (isRTL ? "عميل مسجل" : "Registered User")}</span>
            </div>
            <div className="info-field-row">
              <span className="info-field-label">{t("customerEmail") || (isRTL ? "البريد الإلكتروني" : "Email")}</span>
              <span className="info-field-value">{order.user?.email || "-"}</span>
            </div>
            <div className="info-field-row">
              <span className="info-field-label">{t("customerPhone") || (isRTL ? "هاتف العميل" : "Customer Phone")}</span>
              <span className="info-field-value" dir="ltr">{order.user?.phone || "-"}</span>
            </div>
          </div>
        </div>

        {/* Delivery Information Card */}
        <div className="order-info-card">
          <div className="order-info-card-header">
            <FiMapPin className="order-info-card-icon" aria-hidden="true" />
            <h3>{t("deliveryInfo") || (isRTL ? "بيانات التوصيل" : "Delivery Information")}</h3>
          </div>
          <div className="info-fields-list">
            <div className="info-field-row">
              <span className="info-field-label">{t("governorate") || (isRTL ? "المحافظة" : "Governorate")}</span>
              <span className="info-field-value">{order.governorate || "-"}</span>
            </div>
            <div className="info-field-row">
              <span className="info-field-label">{t("address") || (isRTL ? "العنوان بالتفصيل" : "Address")}</span>
              <span className="info-field-value">{order.address || "-"}</span>
            </div>
            <div className="info-field-row">
              <span className="info-field-label">{t("deliveryPhone") || (isRTL ? "هاتف التوصيل" : "Delivery Phone")}</span>
              <span className="info-field-value" dir="ltr">{order.delivery_phone || "-"}</span>
            </div>
            <div className="info-field-row">
              <span className="info-field-label">{t("orderNote") || (isRTL ? "ملاحظات الطلب" : "Order Notes")}</span>
              <span className={`info-field-value ${order.note ? "info-field-note" : ""}`}>
                {order.note ? order.note : (t("noNotes") || (isRTL ? "لا توجد ملاحظات" : "No notes"))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Order Items List Card */}
      <div className="order-items-card">
        <div className="order-info-card-header">
          <FiPackage className="order-info-card-icon" aria-hidden="true" />
          <h3>{t("orderItems") || (isRTL ? "عناصر الطلب" : "Order Items")} ({items.length})</h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="order-items-table" aria-label="Order Items List">
            <thead>
              <tr>
                <th>{t("product") || (isRTL ? "المنتج" : "Product")}</th>
                <th>{t("unitPrice") || (isRTL ? "سعر القطعة" : "Unit Price")}</th>
                <th>{t("quantity") || (isRTL ? "الكمية" : "Quantity")}</th>
                <th>{t("itemTotal") || (isRTL ? "الإجمالي" : "Total")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const productName = isRTL
                  ? item.product_name_ar || item.product_name_en
                  : item.product_name_en || item.product_name_ar;

                const variant = item.variant_details;
                const unitPrice = Number(item.price) || 0;
                const itemQty = Number(item.quantity) || 1;
                const itemTotal = Number(item.total) || unitPrice * itemQty;

                return (
                  <tr key={item.id || idx}>
                    {/* Product Cell */}
                    <td>
                      <div className="item-product-cell">
                        <div className="item-thumb-box">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={productName}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = '<span>🛍️</span>';
                              }}
                            />
                          ) : (
                            <span>🛍️</span>
                          )}
                        </div>

                        <div className="item-title-meta">
                          <span className="item-name-text">{productName}</span>

                          {/* Safe Variant Display */}
                          {variant && (
                            <div className="item-variant-tags">
                              {variant.color && (
                                <span className="item-variant-tag">
                                  <span>{t("color") || (isRTL ? "اللون" : "Color")}:</span>
                                  <strong>
                                    {isRTL
                                      ? variant.color.name_ar || variant.color.name_en
                                      : variant.color.name_en || variant.color.name_ar}
                                  </strong>
                                </span>
                              )}
                              {variant.size && (
                                <span className="item-variant-tag">
                                  <span>{t("size") || (isRTL ? "المقاس" : "Size")}:</span>
                                  <strong>{variant.size.name}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td>
                      {unitPrice.toLocaleString()} {t("currencySymbol") || "ج.م"}
                    </td>

                    {/* Quantity */}
                    <td>
                      <span className="order-items-badge" style={{ fontSize: "0.85rem", padding: "0.25rem 0.65rem" }}>
                        {itemQty}
                      </span>
                    </td>

                    {/* Total Price */}
                    <td>
                      <span className="order-total-price">
                        {itemTotal.toLocaleString()} {t("currencySymbol") || "ج.م"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 5: Order Summary Calculation Box */}
        <div className="order-summary-box">
          <div className="summary-calc-row">
            <span>{t("subtotal") || (isRTL ? "الإجمالي الفرعي" : "Subtotal")}:</span>
            <span className="val">
              {(Number(order.subtotal) || 0).toLocaleString()} {t("currencySymbol") || "ج.م"}
            </span>
          </div>

          <div className="summary-calc-row">
            <span>{t("shipping") || (isRTL ? "الشحن" : "Shipping")}:</span>
            <span className="val">
              {(Number(order.shipping) || 0).toLocaleString()} {t("currencySymbol") || "ج.م"}
            </span>
          </div>

          <div className="summary-calc-row total-calc">
            <span>{t("total") || (isRTL ? "الإجمالي الكلي" : "Total")}:</span>
            <span className="val">
              {(Number(order.total) || 0).toLocaleString()} {t("currencySymbol") || "ج.م"}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================
          ORDER STATUS UPDATE MODAL
          ==================================================== */}
      {isStatusModalOpen && (
        <div
          className="order-status-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-details-status-modal-title"
          onClick={handleCloseStatusModal}
        >
          <div
            className="order-status-modal"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Modal Header */}
            <div className="order-status-modal-header">
              <h3 id="order-details-status-modal-title">
                <FiEdit2 aria-hidden="true" style={{ color: "var(--vendo-primary, #2563eb)" }} />
                <span>
                  {t("updateOrderStatus") || (isRTL ? "تعديل حالة الطلب" : "Update Order Status")}
                </span>
              </h3>
              <button
                type="button"
                className="order-status-modal-close"
                onClick={handleCloseStatusModal}
                disabled={isSubmittingStatus}
                aria-label={t("close") || "Close"}
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitStatus}>
              <div className="order-status-modal-body">
                {/* Meta details card */}
                <div className="order-status-meta-card">
                  <div className="order-status-meta-item">
                    <span className="meta-label">
                      {t("orderNumberLabel") || (isRTL ? "رقم الطلب" : "Order #")}
                    </span>
                    <span className="meta-val">{orderNum}</span>
                  </div>

                  <div className="order-status-meta-item">
                    <span className="meta-label">
                      {t("customer") || (isRTL ? "العميل" : "Customer")}
                    </span>
                    <span className="meta-val">
                      {order.user?.name || (isRTL ? "عميل مسجل" : "Customer")}
                    </span>
                  </div>

                  <div className="order-status-meta-item">
                    <span className="meta-label">
                      {t("currentStatus") || (isRTL ? "الحالة الحالية" : "Current Status")}
                    </span>
                    <span className={`dash-order-status ${statusInfo.className}`}>
                      <span className="status-dot" aria-hidden="true" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                </div>

                {/* Subtitle instructions */}
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--vendo-dark, #0f172a)" }}>
                  {t("selectNewStatus") || (isRTL ? "اختر الحالة الجديدة للطلب:" : "Select new order status:")}
                </div>

                {/* Status Options Grid */}
                <div className="order-status-options-list" role="radiogroup">
                  {STATUS_CONFIGS.map((opt) => {
                    const isSelected = selectedStatus === opt.key;
                    const IconComp = opt.icon;
                    const labelKey = `status${opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}`;
                    const label = t(labelKey) || (isRTL ? opt.labelAr : opt.labelEn);
                    const desc = isRTL ? opt.descAr : opt.descEn;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={isSubmittingStatus}
                        className={`order-status-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedStatus(opt.key)}
                      >
                        <div
                          className="order-status-option-icon"
                          style={{
                            backgroundColor: `${opt.dotColor}18`,
                            color: opt.dotColor,
                          }}
                        >
                          <IconComp aria-hidden="true" />
                        </div>

                        <div className="order-status-option-info">
                          <span className="order-status-option-title">{label}</span>
                          <span className="order-status-option-desc">{desc}</span>
                        </div>

                        <div className="order-status-option-radio" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>

                {/* Cancelled Warning Notice */}
                {selectedStatus === "cancelled" && (
                  <div className="order-status-warning-banner" role="alert">
                    <FiAlertTriangle aria-hidden="true" style={{ fontSize: "1.2rem", flexShrink: 0 }} />
                    <span>
                      {t("cancelOrderWarning") ||
                        (isRTL
                          ? "تنبيه: تحويل الطلب إلى ملغي يمنع شحنه للعميل وقد يلغي الحجز."
                          : "Notice: Marking this order as cancelled prevents shipping and will cancel fulfillment.")}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="order-status-modal-footer">
                <button
                  type="button"
                  className="btn-status-cancel"
                  onClick={handleCloseStatusModal}
                  disabled={isSubmittingStatus}
                >
                  {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
                </button>

                <button
                  type="submit"
                  className="btn-status-save"
                  disabled={
                    isSubmittingStatus ||
                    (order.status || "").toLowerCase().trim() === selectedStatus
                  }
                >
                  {isSubmittingStatus ? (
                    <>
                      <FiLoader className="spin-icon" aria-hidden="true" />
                      <span>{t("updatingOrderStatus") || (isRTL ? "جاري الحفظ..." : "Saving...")}</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle aria-hidden="true" />
                      <span>{t("saveStatusChanges") || (isRTL ? "حفظ التغييرات" : "Save Changes")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardOrderDetails;
