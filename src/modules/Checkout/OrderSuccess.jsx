import { Link, useLocation } from "react-router-dom";
import { FiCheckCircle, FiShoppingBag, FiHome, FiUser, FiPackage } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import "./Checkout.css";

export function OrderSuccessPage() {
  const { t, isRTL } = useTranslation();
  const location = useLocation();

  // Received order data from navigation state
  const order = location.state?.order;
  const orderNumber = location.state?.orderNumber || order?.order_number || order?.id || null;

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        {/* Animated Checkmark Badge */}
        <div className="success-badge-icon" aria-hidden="true">
          <FiCheckCircle />
        </div>

        {/* Title & Description */}
        <h1 className="success-title">
          {t("yourOrderHasBeenCreated") || (isRTL ? "تم إنشاء طلبك بنجاح!" : "Your Order Has Been Created!")}
        </h1>

        <p className="success-desc">
          {t("orderSuccessDesc") ||
            (isRTL
              ? "شكرًا لك على ثقتك في Vendo. تم استلام طلبك وجاري مراجعته وتجهيزه للشحن، وسنقوم بالتواصل معك قريبًا لتأكيد التوصيل."
              : "Thank you for shopping with Vendo. Your order has been received and is being prepared for shipment.")}
        </p>

        {/* Order Identifier Box if available */}
        {orderNumber && (
          <div className="order-number-box">
            <span className="order-number-label">
              {t("orderNumber") || (isRTL ? "رقم الطلب" : "Order Number")}
            </span>
            <span className="order-number-val" id="order-success-number">
              #{orderNumber}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="success-actions">
          <Link to="/shop" className="btn-success-primary" id="btn-continue-shopping">
            <FiShoppingBag aria-hidden="true" />
            <span>{t("continueShopping") || (isRTL ? "متابعة التسوق" : "Continue Shopping")}</span>
          </Link>

          <Link to="/profile?tab=orders" className="btn-success-secondary" id="btn-my-orders">
            <FiPackage aria-hidden="true" />
            <span>{t("viewOrders") || (isRTL ? "طلباتي" : "My Orders")}</span>
          </Link>

          <Link to="/" className="btn-success-secondary" id="btn-back-home">
            <FiHome aria-hidden="true" />
            <span>{t("backToHome") || (isRTL ? "الرئيسية" : "Home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
