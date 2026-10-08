import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiTruck,
  FiEye,
  FiShoppingBag,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiAlertCircle,
  FiCalendar,
  FiFileText,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
} from "react-icons/fi";
import { getMyOrders } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import "./MyOrders.css";

// Status configuration map for customer order status badges
const STATUS_CONFIG_MAP = {
  pending: {
    labelAr: "قيد الانتظار",
    labelEn: "Pending",
    className: "status-badge-pending",
    icon: FiClock,
  },
  confirmed: {
    labelAr: "مؤكد",
    labelEn: "Confirmed",
    className: "status-badge-confirmed",
    icon: FiCheckCircle,
  },
  processing: {
    labelAr: "قيد التجهيز",
    labelEn: "Processing",
    className: "status-badge-processing",
    icon: FiRefreshCw,
  },
  shipped: {
    labelAr: "تم الشحن",
    labelEn: "Shipped",
    className: "status-badge-shipped",
    icon: FiTruck,
  },
  delivered: {
    labelAr: "تم التوصيل",
    labelEn: "Delivered",
    className: "status-badge-delivered",
    icon: FiCheckCircle,
  },
  cancelled: {
    labelAr: "ملغي",
    labelEn: "Cancelled",
    className: "status-badge-cancelled",
    icon: FiXCircle,
  },
};

// Safe helper to resolve status display details
const getStatusBadge = (status, isRTL) => {
  const normalized = (status || "").toLowerCase().trim();
  const config =
    STATUS_CONFIG_MAP[normalized] ||
    (normalized === "canceled" ? STATUS_CONFIG_MAP.cancelled : null);

  if (config) {
    const IconComp = config.icon;
    return {
      label: isRTL ? config.labelAr : config.labelEn,
      className: config.className,
      icon: <IconComp aria-hidden="true" />,
    };
  }

  return {
    label: status || (isRTL ? "غير معروف" : "Unknown"),
    className: "status-badge-unknown",
    icon: <FiPackage aria-hidden="true" />,
  };
};

// Safe date formatter
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

export function MyOrders({ onTotalOrdersLoaded }) {
  const { logout } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders from confirmed endpoint: GET /api/my/orders?page={page}
  // Bearer token is automatically attached via api interceptor.
  // user_id is NOT sent.
  const fetchOrders = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);

      try {
        const response = await getMyOrders(pageToLoad);
        if (response && response.success !== false) {
          const fetchedOrders = Array.isArray(response.data) ? response.data : [];
          setOrders(fetchedOrders);

          if (response.pagination) {
            setPagination(response.pagination);
            setCurrentPage(response.pagination.current_page || pageToLoad);
            if (onTotalOrdersLoaded && typeof onTotalOrdersLoaded === "function") {
              onTotalOrdersLoaded(response.pagination.total ?? fetchedOrders.length);
            }
          } else {
            if (onTotalOrdersLoaded && typeof onTotalOrdersLoaded === "function") {
              onTotalOrdersLoaded(fetchedOrders.length);
            }
          }
        } else {
          const errMsg =
            response?.message ||
            (isRTL ? "تعذر جلب الطلبات، يرجى المحاولة لاحقاً." : "Failed to load orders.");
          setError(errMsg);
        }
      } catch (err) {
        console.error("Fetch my orders error:", err);

        if (err.response?.status === 401) {
          toast.error(
            isRTL
              ? "انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى."
              : "Session expired, please log in again."
          );
          await logout();
          navigate("/login");
          return;
        }

        const msg =
          err.response?.data?.message ||
          (isRTL
            ? "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت."
            : "Network error, please check your internet connection.");
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [isRTL, logout, navigate, onTotalOrdersLoaded]
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  // Lock body scroll when order details modal is open
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedOrder]);

  // Pagination page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page && !loading) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="my-orders-section">
      {/* Section Header */}
      <div className="my-orders-header">
        <div className="my-orders-header-info">
          <div className="my-orders-header-icon" aria-hidden="true">
            <FiPackage />
          </div>
          <div>
            <h2 className="my-orders-title">
              {isRTL ? "طلباتي" : "My Orders"}
            </h2>
            <p className="my-orders-subtitle">
              {isRTL
                ? "عرض ومتابعة جميع طلباتك السابقة والحالية."
                : "View and manage your recent orders."}
            </p>
          </div>
        </div>

        {/* Total Orders Badge */}
        {!loading && !error && (
          <div className="my-orders-total-badge">
            <FiTag className="total-badge-icon" aria-hidden="true" />
            <span>
              {isRTL
                ? `لديك ${pagination.total || orders.length} ${
                    (pagination.total || orders.length) === 1
                      ? "طلب"
                      : (pagination.total || orders.length) === 2
                      ? "طلبان"
                      : (pagination.total || orders.length) <= 10
                      ? "طلبات"
                      : "طلب"
                  }`
                : `${pagination.total || orders.length} ${
                    (pagination.total || orders.length) === 1 ? "Order" : "Orders"
                  }`}
            </span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="my-orders-error-card" role="alert">
          <FiAlertCircle className="error-card-icon" aria-hidden="true" />
          <div className="error-card-content">
            <h3 className="error-card-title">{isRTL ? "خطأ في تحميل الطلبات" : "Error Loading Orders"}</h3>
            <p className="error-card-desc">{error}</p>
            <button
              type="button"
              onClick={() => fetchOrders(currentPage)}
              className="btn-retry-orders"
            >
              <FiRefreshCw aria-hidden="true" />
              <span>{isRTL ? "إعادة المحاولة" : "Try Again"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton Cards */}
      {loading && !error && (
        <div className="my-orders-skeletons-list" aria-busy="true">
          {[1, 2].map((idx) => (
            <div key={idx} className="order-skeleton-card">
              <div className="skeleton-header">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-badge" />
              </div>
              <div className="skeleton-items">
                <div className="skeleton-item-row">
                  <div className="skeleton-thumb" />
                  <div className="skeleton-details">
                    <div className="skeleton-line skeleton-name" />
                    <div className="skeleton-line skeleton-meta" />
                  </div>
                </div>
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-line skeleton-price" />
                <div className="skeleton-button" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Orders State */}
      {!loading && !error && orders.length === 0 && (
        <div className="my-orders-empty-state">
          <div className="empty-state-icon-box" aria-hidden="true">
            <FiShoppingBag />
          </div>
          <h3 className="empty-state-title">
            {isRTL ? "لا توجد طلبات حتى الآن" : "No orders yet"}
          </h3>
          <p className="empty-state-desc">
            {isRTL
              ? "لم تقم بإنشاء أي طلبات حتى الآن. استكشف متجر Vendo وتسوق أحدث المنتجات والعروض."
              : "You haven't placed any orders yet. Browse our storefront to discover the latest products."}
          </p>
          <Link to="/shop" className="btn-empty-continue-shopping">
            <FiShoppingBag aria-hidden="true" />
            <span>{isRTL ? "متابعة التسوق" : "Continue Shopping"}</span>
          </Link>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div className="my-orders-cards-list">
          {orders.map((order) => {
            const statusInfo = getStatusBadge(order.status, isRTL);
            const totalItemsQty = Array.isArray(order.items)
              ? order.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)
              : 0;

            return (
              <div key={order.id} className="customer-order-card">
                {/* 1. Order Card Header */}
                <div className="order-card-header">
                  <div className="order-header-main">
                    <span className="order-number-tag">
                      {isRTL ? "طلب" : "Order"} #{order.order_number || order.id}
                    </span>
                    <span className={`order-status-badge ${statusInfo.className}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  <div className="order-header-meta">
                    <span className="order-meta-date">
                      <FiCalendar className="meta-icon" aria-hidden="true" />
                      <span>{formatDate(order.created_at, isRTL)}</span>
                    </span>
                    <span className="order-meta-qty">
                      <FiPackage className="meta-icon" aria-hidden="true" />
                      <span>
                        {totalItemsQty}{" "}
                        {isRTL
                          ? totalItemsQty === 1
                            ? "منتج"
                            : "منتجات"
                          : totalItemsQty === 1
                          ? "item"
                          : "items"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 2. Order Items Preview List */}
                <div className="order-items-preview-list">
                  {Array.isArray(order.items) &&
                    order.items.map((item) => {
                      const itemName = isRTL
                        ? item.product_name_ar || item.product_name_en
                        : item.product_name_en || item.product_name_ar;
                      const hasColor = Boolean(
                        item.variant_details?.color?.name_ar ||
                          item.variant_details?.color?.name_en
                      );
                      const hasSize = Boolean(item.variant_details?.size?.name);

                      return (
                        <div key={item.id} className="order-item-row">
                          {/* Product Image */}
                          <div className="order-item-thumb-box">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={itemName || "Product"}
                                className="order-item-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML =
                                    '<span class="order-item-thumb-fallback">🛍️</span>';
                                }}
                              />
                            ) : (
                              <span className="order-item-thumb-fallback">🛍️</span>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="order-item-info">
                            <h4 className="order-item-title" title={itemName}>
                              {itemName}
                            </h4>

                            {/* Safe Variant Display */}
                            {(hasColor || hasSize) && (
                              <div className="order-item-variant-tags">
                                {hasColor && (
                                  <span className="item-variant-pill">
                                    <span className="pill-label">{isRTL ? "اللون:" : "Color:"}</span>
                                    <span>
                                      {isRTL
                                        ? item.variant_details.color.name_ar ||
                                          item.variant_details.color.name_en
                                        : item.variant_details.color.name_en ||
                                          item.variant_details.color.name_ar}
                                    </span>
                                  </span>
                                )}
                                {hasSize && (
                                  <span className="item-variant-pill">
                                    <span className="pill-label">{isRTL ? "المقاس:" : "Size:"}</span>
                                    <span>{item.variant_details.size.name}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Quantity & Unit Price */}
                            <div className="order-item-pricing-line">
                              <span className="item-qty-badge">
                                {isRTL ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                              </span>
                              <span className="item-unit-price">
                                {Number(item.price).toLocaleString()}{" "}
                                {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                              </span>
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="order-item-line-total">
                            {Number(item.total).toLocaleString()}{" "}
                            {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 3. Order Card Footer: Price Breakdown & Action */}
                <div className="order-card-footer">
                  <div className="order-card-totals">
                    <div className="totals-row">
                      <span>{isRTL ? "الإجمالي الفرعي:" : "Subtotal:"}</span>
                      <strong>
                        {Number(order.subtotal).toLocaleString()}{" "}
                        {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                      </strong>
                    </div>
                    <div className="totals-row">
                      <span>{isRTL ? "الشحن:" : "Shipping:"}</span>
                      <strong>
                        {Number(order.shipping).toLocaleString()}{" "}
                        {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                      </strong>
                    </div>
                    <div className="totals-row total-highlight">
                      <span>{isRTL ? "الإجمالي الكلي:" : "Total:"}</span>
                      <strong className="total-highlight-val">
                        {Number(order.total).toLocaleString()}{" "}
                        {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                      </strong>
                    </div>
                  </div>

                  <div className="order-card-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="btn-view-order-details"
                    >
                      <FiEye aria-hidden="true" />
                      <span>{isRTL ? "عرض تفاصيل الطلب" : "View Order Details"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 4. Server-Side Pagination Controls */}
          {pagination.last_page > 1 && (
            <div className="orders-pagination-bar" aria-label="Orders Pagination">
              <div className="pagination-summary">
                {isRTL
                  ? `صفحة ${pagination.current_page} من ${pagination.last_page} (إجمالي ${pagination.total} طلب)`
                  : `Page ${pagination.current_page} of ${pagination.last_page} (${pagination.total} total orders)`}
              </div>

              <div className="pagination-buttons-wrap">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="btn-pagination-nav"
                  aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
                >
                  {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
                  <span>{isRTL ? "السابق" : "Previous"}</span>
                </button>

                <div className="pagination-page-numbers">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      disabled={loading}
                      onClick={() => handlePageChange(pageNum)}
                      className={`btn-page-number ${pageNum === currentPage ? "active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= pagination.last_page || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="btn-pagination-nav"
                  aria-label={isRTL ? "الصفحة التالية" : "Next page"}
                >
                  <span>{isRTL ? "التالي" : "Next"}</span>
                  {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          Order Details Modal (Reuses fetched order object)
          Does NOT make duplicate/invented API requests.
          ======================================================== */}
      {selectedOrder && (
        <div
          className="order-details-modal-overlay"
          onClick={() => setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="order-details-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-details-header">
              <div className="modal-header-meta">
                <h3 className="modal-order-number">
                  {isRTL ? "تفاصيل الطلب" : "Order Details"} #{selectedOrder.order_number || selectedOrder.id}
                </h3>
                <div className="modal-status-and-date">
                  <span className={`order-status-badge ${getStatusBadge(selectedOrder.status, isRTL).className}`}>
                    {getStatusBadge(selectedOrder.status, isRTL).icon}
                    <span>{getStatusBadge(selectedOrder.status, isRTL).label}</span>
                  </span>
                  <span className="modal-date-text">
                    <FiCalendar aria-hidden="true" />
                    <span>{formatDate(selectedOrder.created_at, isRTL)}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-close-modal"
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="modal-details-body">
              {/* Customer Information (Read-only) */}
              {selectedOrder.user && (
                <div className="details-info-section">
                  <h4 className="details-section-title">
                    <FiUser className="title-icon" aria-hidden="true" />
                    <span>{isRTL ? "بيانات العميل" : "Customer Information"}</span>
                  </h4>
                  <div className="details-grid-two">
                    <div className="detail-item">
                      <span className="detail-label">{isRTL ? "اسم العميل" : "Customer Name"}</span>
                      <strong className="detail-value">{selectedOrder.user.name || "—"}</strong>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{isRTL ? "البريد الإلكتروني" : "Email"}</span>
                      <strong className="detail-value" dir="ltr">{selectedOrder.user.email || "—"}</strong>
                    </div>
                    {selectedOrder.user.phone && (
                      <div className="detail-item">
                        <span className="detail-label">{isRTL ? "رقم الهاتف المسجل" : "Registered Phone"}</span>
                        <strong className="detail-value" dir="ltr">{selectedOrder.user.phone}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Information */}
              <div className="details-info-section">
                <h4 className="details-section-title">
                  <FiMapPin className="title-icon" aria-hidden="true" />
                  <span>{isRTL ? "بيانات التوصيل والشحن" : "Delivery Information"}</span>
                </h4>
                <div className="details-grid-two">
                  <div className="detail-item">
                    <span className="detail-label">{isRTL ? "المحافظة" : "Governorate"}</span>
                    <strong className="detail-value">{selectedOrder.governorate || "—"}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{isRTL ? "رقم هاتف التوصيل" : "Delivery Phone"}</span>
                    <strong className="detail-value" dir="ltr">{selectedOrder.delivery_phone || "—"}</strong>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">{isRTL ? "العنوان بالتفصيل" : "Delivery Address"}</span>
                    <p className="detail-text-address">{selectedOrder.address || "—"}</p>
                  </div>
                  {/* Note block only shown if note exists and not empty */}
                  {selectedOrder.note && selectedOrder.note.trim() && (
                    <div className="detail-item full-width note-block">
                      <span className="detail-label">
                        <FiFileText aria-hidden="true" />
                        <span>{isRTL ? "ملاحظات التوصيل" : "Delivery Note"}</span>
                      </span>
                      <p className="detail-text-note">{selectedOrder.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordered Items List */}
              <div className="details-info-section">
                <h4 className="details-section-title">
                  <FiPackage className="title-icon" aria-hidden="true" />
                  <span>{isRTL ? "عناصر الطلب" : "Order Items"}</span>
                </h4>
                <div className="modal-items-list">
                  {Array.isArray(selectedOrder.items) &&
                    selectedOrder.items.map((item) => {
                      const itemName = isRTL
                        ? item.product_name_ar || item.product_name_en
                        : item.product_name_en || item.product_name_ar;
                      const hasColor = Boolean(
                        item.variant_details?.color?.name_ar ||
                          item.variant_details?.color?.name_en
                      );
                      const hasSize = Boolean(item.variant_details?.size?.name);

                      return (
                        <div key={item.id} className="modal-item-row">
                          <div className="modal-item-thumb-box">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={itemName || "Product"}
                                className="modal-item-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML =
                                    '<span class="modal-item-thumb-fallback">🛍️</span>';
                                }}
                              />
                            ) : (
                              <span className="modal-item-thumb-fallback">🛍️</span>
                            )}
                          </div>

                          <div className="modal-item-details">
                            <h5 className="modal-item-name">{itemName}</h5>
                            {(hasColor || hasSize) && (
                              <div className="modal-variant-badges">
                                {hasColor && (
                                  <span className="item-variant-pill">
                                    <span className="pill-label">{isRTL ? "اللون:" : "Color:"}</span>
                                    <span>
                                      {isRTL
                                        ? item.variant_details.color.name_ar ||
                                          item.variant_details.color.name_en
                                        : item.variant_details.color.name_en ||
                                          item.variant_details.color.name_ar}
                                    </span>
                                  </span>
                                )}
                                {hasSize && (
                                  <span className="item-variant-pill">
                                    <span className="pill-label">{isRTL ? "المقاس:" : "Size:"}</span>
                                    <span>{item.variant_details.size.name}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="modal-item-qty-price">
                              <span>
                                {Number(item.price).toLocaleString()}{" "}
                                {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                              </span>
                              {" × "}
                              <strong>{item.quantity}</strong>
                            </div>
                          </div>

                          <div className="modal-item-total">
                            {Number(item.total).toLocaleString()}{" "}
                            {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="details-info-section summary-section">
                <h4 className="details-section-title">
                  <FiTag className="title-icon" aria-hidden="true" />
                  <span>{isRTL ? "ملخص الفاتورة" : "Invoice Summary"}</span>
                </h4>
                <div className="modal-summary-box">
                  <div className="summary-row">
                    <span>{isRTL ? "الإجمالي الفرعي:" : "Subtotal:"}</span>
                    <span>
                      {Number(selectedOrder.subtotal).toLocaleString()}{" "}
                      {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>{isRTL ? "رسوم الشحن والتوصيل:" : "Shipping:"}</span>
                    <span>
                      {Number(selectedOrder.shipping).toLocaleString()}{" "}
                      {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                    </span>
                  </div>
                  <div className="summary-row total-row">
                    <span>{isRTL ? "الإجمالي النهائي:" : "Total Amount:"}</span>
                    <strong className="summary-grand-total">
                      {Number(selectedOrder.total).toLocaleString()}{" "}
                      {t("currencySymbol") || (isRTL ? "ج.م" : "EGP")}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-details-footer">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-modal-close"
              >
                <span>{isRTL ? "إغلاق" : "Close"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
