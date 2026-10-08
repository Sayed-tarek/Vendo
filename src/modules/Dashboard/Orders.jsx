import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiPackage,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
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
  getDashboardOrders,
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

// Helper: Calculate total items quantity
const getItemsTotalCount = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
};

// Helper: Resolve status badge details with safe fallback across all statuses
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

export function DashboardOrders() {
  const { t, isRTL } = useTranslation();

  // Orders list & server-side pagination state
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Status update modal state
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Fetch orders from backend using clean async effect
  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        const response = await getDashboardOrders(currentPage);

        if (!ignore) {
          if (response && response.data) {
            setOrders(Array.isArray(response.data) ? response.data : []);
            if (response.pagination) {
              setPagination(response.pagination);
            }
          } else {
            setOrders([]);
          }
          setFetchError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch dashboard orders error:", err);
          setFetchError(
            err.response?.data?.message ||
              t("errorLoadingOrders") ||
              (isRTL ? "حدث خطأ أثناء تحميل الطلبات" : "Failed to load orders")
          );
        }
      } finally {
        if (!ignore) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [currentPage, refreshTrigger, t, isRTL]);

  // Page change handler
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.last_page &&
      newPage !== currentPage &&
      !loadingOrders
    ) {
      setLoadingOrders(true);
      setCurrentPage(newPage);
    }
  };

  const handleRefresh = () => {
    setLoadingOrders(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Open Status Edit Modal
  const handleOpenStatusModal = (order) => {
    const current = (order?.status || "").toLowerCase().trim();
    const matched = ORDER_STATUSES.includes(current)
      ? current
      : current === "canceled"
      ? "cancelled"
      : "pending";

    setStatusModalOrder(order);
    setSelectedStatus(matched);
  };

  // Close Status Edit Modal
  const handleCloseStatusModal = () => {
    if (isSubmittingStatus) return;
    setStatusModalOrder(null);
  };

  // Submit Status Update
  const handleSubmitStatus = async (e) => {
    if (e) e.preventDefault();
    if (!statusModalOrder || !selectedStatus || isSubmittingStatus) return;

    // Do nothing if same status
    const current = (statusModalOrder.status || "").toLowerCase().trim();
    if (current === selectedStatus || (current === "canceled" && selectedStatus === "cancelled")) {
      handleCloseStatusModal();
      return;
    }

    setIsSubmittingStatus(true);
    try {
      // POST /dashboard/update/orders/{id}/status with payload: { "status": selectedStatus }
      await updateDashboardOrderStatus(statusModalOrder.id, selectedStatus);

      // Local optimistic update
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === statusModalOrder.id ? { ...ord, status: selectedStatus } : ord
        )
      );

      const statusObj = STATUS_CONFIGS.find((c) => c.key === selectedStatus);
      const localizedLabel = isRTL ? statusObj?.labelAr : statusObj?.labelEn;

      toast.success(
        t("orderStatusUpdatedSuccess") ||
          (isRTL
            ? `تم تحديث حالة الطلب بنجاح إلى "${localizedLabel || selectedStatus}".`
            : `Order status updated successfully to "${localizedLabel || selectedStatus}".`)
      );

      setStatusModalOrder(null);
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

  return (
    <div className="orders-dashboard-view">
      {/* Toast Notification Container */}
      <Toaster position={isRTL ? "top-left" : "top-right"} reverseOrder={false} />

      {/* Page Header */}
      <div className="orders-page-header">
        <div className="orders-header-info">
          <div className="orders-header-icon" aria-hidden="true">
            <FiPackage />
          </div>
          <div>
            <h1 className="orders-header-title">
              {t("ordersTitle") || (isRTL ? "الطلبات" : "Orders")}
            </h1>
            <p className="orders-header-subtitle">
              {t("ordersSubtitle") ||
                (isRTL
                  ? "متابعة وإدارة طلبات العملاء وتعديل حالة الطلب والتفاصيل."
                  : "Track and manage customer orders, fulfillment status, and order details.")}
            </p>
          </div>
        </div>

        <div className="orders-header-actions">
          {!loadingOrders && (
            <span className="orders-count-pill">
              {t("totalOrdersCount") || (isRTL ? "إجمالي الطلبات" : "Total Orders")}:{" "}
              <strong>{pagination.total}</strong>
            </span>
          )}

          <button
            type="button"
            className="btn-orders-refresh"
            onClick={handleRefresh}
            disabled={loadingOrders}
            aria-label={t("retry") || "Refresh"}
          >
            <FiRefreshCw className={loadingOrders ? "spin-icon" : ""} aria-hidden="true" />
            <span>{isRTL ? "تحديث" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loadingOrders && (
        <div className="orders-table-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton-row" style={{ width: "100%", height: "40px" }} />
          <div className="skeleton-row" style={{ width: "100%", height: "55px" }} />
          <div className="skeleton-row" style={{ width: "100%", height: "55px" }} />
          <div className="skeleton-row" style={{ width: "100%", height: "55px" }} />
          <div className="skeleton-row" style={{ width: "100%", height: "55px" }} />
        </div>
      )}

      {/* Error State */}
      {!loadingOrders && fetchError && (
        <div className="orders-state-box" role="alert">
          <div className="orders-state-icon error" aria-hidden="true">
            <FiAlertCircle />
          </div>
          <h2 className="orders-state-title">
            {t("errorLoadingOrders") || (isRTL ? "حدث خطأ أثناء تحميل الطلبات" : "Failed to Load Orders")}
          </h2>
          <p className="orders-state-desc">{fetchError}</p>
          <button
            type="button"
            className="btn-orders-refresh"
            onClick={handleRefresh}
            style={{ margin: "0 auto" }}
          >
            <FiRefreshCw aria-hidden="true" />
            <span>{t("retry") || (isRTL ? "إعادة المحاولة" : "Retry")}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loadingOrders && !fetchError && orders.length === 0 && (
        <div className="orders-state-box">
          <div className="orders-state-icon empty" aria-hidden="true">
            <FiPackage />
          </div>
          <h2 className="orders-state-title">
            {t("noOrders") || (isRTL ? "لا توجد طلبات" : "No Orders Found")}
          </h2>
          <p className="orders-state-desc">
            {t("noOrdersDesc") ||
              (isRTL
                ? "لم يتم إنشاء أي طلبات من قبل العملاء حتى الآن."
                : "No customer orders have been placed in the system yet.")}
          </p>
        </div>
      )}

      {/* Orders List Content */}
      {!loadingOrders && !fetchError && orders.length > 0 && (
        <div className="orders-table-card">
          {/* Desktop Table View */}
          <div className="desktop-orders-table-wrap">
            <table className="desktop-orders-table" aria-label="Customer Orders">
              <thead>
                <tr>
                  <th>{t("orderNumberLabel") || (isRTL ? "رقم الطلب" : "Order #")}</th>
                  <th>{t("customer") || (isRTL ? "العميل" : "Customer")}</th>
                  <th>{t("customerPhone") || (isRTL ? "الهاتف" : "Phone")}</th>
                  <th>{t("orderItemsCount") || (isRTL ? "عدد العناصر" : "Items")}</th>
                  <th>{t("subtotal") || (isRTL ? "الإجمالي الفرعي" : "Subtotal")}</th>
                  <th>{t("shipping") || (isRTL ? "الشحن" : "Shipping")}</th>
                  <th>{t("total") || (isRTL ? "الإجمالي" : "Total")}</th>
                  <th>{t("status") || (isRTL ? "الحالة" : "Status")}</th>
                  <th>{t("createdAt") || (isRTL ? "تاريخ الطلب" : "Date")}</th>
                  <th style={{ textAlign: "center" }}>{isRTL ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = getStatusBadge(order.status, t, isRTL);
                  const itemsCount = getItemsTotalCount(order.items);
                  const customerName = order.user?.name || (isRTL ? "عميل غير معروف" : "Unknown Customer");
                  const customerEmail = order.user?.email || "";
                  const phone = order.delivery_phone || order.user?.phone || "-";
                  const orderNum = order.order_number || `#${order.id}`;

                  return (
                    <tr key={order.id}>
                      {/* Order Number */}
                      <td>
                        <span className="order-num-text" title={orderNum}>
                          {orderNum}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div className="order-customer-cell">
                          <span className="order-customer-name">{customerName}</span>
                          {customerEmail && (
                            <span className="order-customer-email">{customerEmail}</span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <span className="order-phone-cell">{phone}</span>
                      </td>

                      {/* Items Count */}
                      <td>
                        <span className="order-items-badge">
                          {itemsCount} {isRTL ? "منتجات" : "items"}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td>
                        {(Number(order.subtotal) || 0).toLocaleString()} {t("currencySymbol") || "ج.م"}
                      </td>

                      {/* Shipping */}
                      <td>
                        {(Number(order.shipping) || 0).toLocaleString()} {t("currencySymbol") || "ج.م"}
                      </td>

                      {/* Total */}
                      <td>
                        <span className="order-total-price">
                          {(Number(order.total) || 0).toLocaleString()} {t("currencySymbol") || "ج.م"}
                        </span>
                      </td>

                      {/* Status - Interactive Badge to open status edit modal */}
                      <td>
                        <button
                          type="button"
                          className="order-status-btn-cell"
                          onClick={() => handleOpenStatusModal(order)}
                          title={
                            t("updateOrderStatus") ||
                            (isRTL ? "انقر لتعديل حالة الطلب" : "Click to update order status")
                          }
                        >
                          <span className={`dash-order-status ${statusInfo.className}`}>
                            <span className="status-dot" aria-hidden="true" />
                            <span>{statusInfo.label}</span>
                            <FiEdit2 className="status-edit-hint" aria-hidden="true" />
                          </span>
                        </button>
                      </td>

                      {/* Created At */}
                      <td>
                        <span className="order-date-text">
                          {formatDateTime(order.created_at, isRTL)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <div className="table-actions-group">
                          <Link
                            to={`/dashboard/orders/${order.id}`}
                            className="btn-order-view"
                            title={t("viewDetails") || (isRTL ? "عرض التفاصيل" : "View Details")}
                          >
                            <FiEye aria-hidden="true" />
                            <span>{t("viewDetails") || (isRTL ? "عرض التفاصيل" : "View Details")}</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Controls */}
          {pagination.last_page > 1 && (
            <div className="pagination-bar" aria-label="Pagination Navigation">
              <div className="pagination-info">
                {`${t("paginationPage") || "Page"} ${currentPage} ${t("paginationOf") || "of"} ${
                  pagination.last_page
                } (${t("totalOrdersCount") || "Total"}: ${pagination.total})`}
              </div>

              <div className="pagination-controls">
                {/* Previous Button */}
                <button
                  type="button"
                  className="btn-page-step"
                  disabled={currentPage <= 1 || loadingOrders}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label={t("paginationPrev") || "Previous Page"}
                >
                  {isRTL ? <FiChevronRight aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
                  <span>{t("paginationPrev") || (isRTL ? "السابق" : "Prev")}</span>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn-page-number ${currentPage === pageNum ? "active" : ""}`}
                    disabled={loadingOrders}
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  type="button"
                  className="btn-page-step"
                  disabled={currentPage >= pagination.last_page || loadingOrders}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label={t("paginationNext") || "Next Page"}
                >
                  <span>{t("paginationNext") || (isRTL ? "التالي" : "Next")}</span>
                  {isRTL ? <FiChevronLeft aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          ORDER STATUS UPDATE MODAL
          ==================================================== */}
      {statusModalOrder && (
        <div
          className="order-status-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-status-modal-title"
          onClick={handleCloseStatusModal}
        >
          <div
            className="order-status-modal"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Modal Header */}
            <div className="order-status-modal-header">
              <h3 id="order-status-modal-title">
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
                    <span className="meta-val">
                      {statusModalOrder.order_number || `#${statusModalOrder.id}`}
                    </span>
                  </div>

                  <div className="order-status-meta-item">
                    <span className="meta-label">
                      {t("customer") || (isRTL ? "العميل" : "Customer")}
                    </span>
                    <span className="meta-val">
                      {statusModalOrder.user?.name || (isRTL ? "عميل مسجل" : "Customer")}
                    </span>
                  </div>

                  <div className="order-status-meta-item">
                    <span className="meta-label">
                      {t("currentStatus") || (isRTL ? "الحالة الحالية" : "Current Status")}
                    </span>
                    {(() => {
                      const curInfo = getStatusBadge(statusModalOrder.status, t, isRTL);
                      return (
                        <span className={`dash-order-status ${curInfo.className}`}>
                          <span className="status-dot" aria-hidden="true" />
                          <span>{curInfo.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Subtitle instructions */}
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--vendo-dark, #0f172a)" }}>
                  {t("selectNewStatus") || (isRTL ? "اختر الحالة الجديدة للطلب:" : "Select new order status:")}
                </div>

                {/* Status Options Grid (Rule::in([pending, confirmed, processing, shipped, delivered, cancelled])) */}
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
                    (statusModalOrder.status || "").toLowerCase().trim() === selectedStatus
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

export default DashboardOrders;
