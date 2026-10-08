import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingCart,
  FiArrowLeft,
  FiArrowRight,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiShield,
  FiTruck,
  FiShoppingBag,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "@/modules/Products/utils/storefrontState";
import "./Cart.css";

export function CartPage() {
  const { t, isRTL } = useTranslation();
  const [cart, setCart] = useState(() => getCart());

  // Listen to cart events across the application
  useEffect(() => {
    const handleCartSync = () => {
      setCart(getCart());
    };
    window.addEventListener("vendo_cart_updated", handleCartSync);
    return () => window.removeEventListener("vendo_cart_updated", handleCartSync);
  }, []);

  const handleQtyChange = (cartItemId, newQty) => {
    updateCartQuantity(cartItemId, newQty);
  };

  const handleRemove = (cartItemId) => {
    removeFromCart(cartItemId);
  };

  const handleClearAll = () => {
    if (window.confirm(isRTL ? "هل أنت متأكد من رغبتك في إفراغ السلة؟" : "Are you sure you want to clear your cart?")) {
      clearCart();
    }
  };

  const subtotal = cart.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return acc + price * qty;
  }, 0);

  const fixedShipping = 50;
  const total = subtotal + fixedShipping;
  const totalItemsCount = cart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  // -------------------------------------------------------------------------
  // Empty Cart State
  // -------------------------------------------------------------------------
  if (cart.length === 0) {
    return (
      <div className="vendo-cart-page cart-empty-view">
        <div className="cart-container">
          <div className="cart-empty-card">
            <div className="cart-empty-icon" aria-hidden="true">
              <FiShoppingCart />
            </div>
            <h1 className="cart-empty-title">
              {isRTL ? "عربة التسوق فارغة" : "Your Shopping Cart is Empty"}
            </h1>
            <p className="cart-empty-desc">
              {isRTL
                ? "لم تقم بإضافة أي منتجات إلى عربة التسوق بعد. تصفح أحدث المنتجات والعروض المميزة واختر ما يناسبك الآن."
                : "You haven't added any items to your shopping cart yet. Explore our latest products and exclusive offers."}
            </p>
            <Link to="/shop" className="btn-cart-shop" id="btn-explore-shop">
              <FiShoppingBag aria-hidden="true" />
              <span>{isRTL ? "استكشف المتجر الآن" : "Explore Shop Now"}</span>
              {isRTL ? <FiArrowLeft aria-hidden="true" /> : <FiArrowRight aria-hidden="true" />}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Active Cart View (Items added)
  // -------------------------------------------------------------------------
  return (
    <div className="vendo-cart-page">
      <div className="cart-container">
        {/* Page Top Header */}
        <div className="cart-top-bar">
          <div className="cart-title-wrap">
            <h1 className="cart-title">
              <span className="cart-title-icon" aria-hidden="true">
                <FiShoppingCart />
              </span>
              {isRTL ? "عربة التسوق" : "Shopping Cart"}
            </h1>
            <span className="cart-count-badge">
              {totalItemsCount} {isRTL ? "منتج" : "items"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="btn-clear-cart"
            title={isRTL ? "إفراغ السلة بالكامل" : "Clear Entire Cart"}
          >
            <FiTrash2 aria-hidden="true" />
            <span>{isRTL ? "إفراغ السلة" : "Clear Cart"}</span>
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="cart-main-grid">
          {/* Column 1: Items List */}
          <div className="cart-items-column">
            <div className="cart-card">
              <div className="cart-items-list">
                {cart.map((item) => {
                  const itemName = isRTL ? item.name_ar || item.name_en : item.name_en || item.name_ar;
                  const itemPrice = Number(item.price) || 0;
                  const itemQty = Number(item.quantity) || 1;
                  const itemTotal = itemPrice * itemQty;
                  const itemUrl = `/products/${item.id}`;

                  return (
                    <div key={item.cartItemId} className="cart-item-row">
                      {/* Product Thumbnail */}
                      <Link to={itemUrl} className="cart-item-image-link" tabIndex={-1}>
                        <div className="cart-item-image-wrap">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={itemName}
                              className="cart-item-image"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = '<span class="cart-placeholder-icon">🛍️</span>';
                              }}
                            />
                          ) : (
                            <span className="cart-placeholder-icon">🛍️</span>
                          )}
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="cart-item-body">
                        <Link to={itemUrl} className="cart-item-title-link">
                          <h2 className="cart-item-title">{itemName}</h2>
                        </Link>

                        {/* Variant Badges */}
                        {item.variant && (
                          <div className="cart-item-variants">
                            {item.variant.color && (
                              <span className="cart-variant-pill">
                                {item.variant.color.code && (
                                  <span
                                    className="cart-variant-color-dot"
                                    style={{ backgroundColor: item.variant.color.code }}
                                    aria-hidden="true"
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
                              <span className="cart-variant-pill size-pill">
                                <span>{item.variant.size.name}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Unit Price */}
                        <div className="cart-item-unit-price">
                          <span className="price-label">{isRTL ? "سعر القطعة:" : "Unit Price:"}</span>
                          <strong>{itemPrice.toLocaleString()} {t("currencySymbol") || "ج.م"}</strong>
                        </div>
                      </div>

                      {/* Item Actions: Quantity Controls & Subtotal */}
                      <div className="cart-item-control-area">
                        {/* Quantity Counter */}
                        <div className="cart-quantity-box">
                          <button
                            type="button"
                            className="cart-quantity-btn minus"
                            aria-label={isRTL ? "تقليل الكمية" : "Decrease quantity"}
                            onClick={() => handleQtyChange(item.cartItemId, itemQty - 1)}
                          >
                            <FiMinus aria-hidden="true" />
                          </button>
                          <span className="cart-quantity-display" aria-label={`Quantity: ${itemQty}`}>
                            {itemQty}
                          </span>
                          <button
                            type="button"
                            className="cart-quantity-btn plus"
                            aria-label={isRTL ? "زيادة الكمية" : "Increase quantity"}
                            onClick={() => handleQtyChange(item.cartItemId, itemQty + 1)}
                          >
                            <FiPlus aria-hidden="true" />
                          </button>
                        </div>

                        {/* Row Subtotal */}
                        <div className="cart-item-subtotal">
                          {itemTotal.toLocaleString()} {t("currencySymbol") || "ج.م"}
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          className="cart-remove-action"
                          onClick={() => handleRemove(item.cartItemId)}
                          aria-label={isRTL ? "حذف المنتج من السلة" : "Remove item from cart"}
                          title={isRTL ? "حذف من السلة" : "Remove"}
                        >
                          <FiTrash2 aria-hidden="true" />
                          <span className="remove-text">{isRTL ? "حذف" : "Remove"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions inside list */}
              <div className="cart-card-footer">
                <Link to="/shop" className="btn-continue-shopping-link">
                  {isRTL ? <FiArrowRight aria-hidden="true" /> : <FiArrowLeft aria-hidden="true" />}
                  <span>{isRTL ? "متابعة التسوق وإضافة المزيد" : "Continue Shopping for More"}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Order Summary Sidebar */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h2 className="summary-title">
                {t("orderSummary") || (isRTL ? "ملخص الطلب" : "Order Summary")}
              </h2>

              <div className="summary-rows-group">
                <div className="summary-row">
                  <span>{t("subtotal") || (isRTL ? "الإجمالي الفرعي" : "Subtotal")}</span>
                  <span className="summary-value">
                    {subtotal.toLocaleString()} {t("currencySymbol") || "ج.م"}
                  </span>
                </div>

                <div className="summary-row">
                  <span>{t("shipping") || (isRTL ? "الشحن المتوقع" : "Shipping")}</span>
                  <span className="summary-value">
                    {fixedShipping} {t("currencySymbol") || "ج.م"}
                  </span>
                </div>

                <div className="summary-shipping-note">
                  <FiTruck aria-hidden="true" />
                  <span>{isRTL ? "شحن قياسي سريع لكافة المحافظات" : "Fast standard delivery to all governorates"}</span>
                </div>

                <div className="summary-row total-highlight">
                  <span>{t("total") || (isRTL ? "الإجمالي الكلي" : "Total")}</span>
                  <span className="summary-total-val">
                    {total.toLocaleString()} {t("currencySymbol") || "ج.م"}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link to="/checkout" className="btn-proceed-checkout" id="cart-to-checkout-btn">
                <span>{t("checkoutTitle") || (isRTL ? "إتمام الشراء الآن" : "Proceed to Checkout")}</span>
                {isRTL ? <FiArrowLeft aria-hidden="true" /> : <FiArrowRight aria-hidden="true" />}
              </Link>

              {/* Security & Guarantee Signals */}
              <div className="cart-trust-badges">
                <div className="trust-badge-item">
                  <FiShield className="trust-badge-icon" aria-hidden="true" />
                  <span>{isRTL ? "تسوق آمن وموثوق 100%" : "100% Safe & Secure"}</span>
                </div>
                <div className="trust-badge-item">
                  <FiTruck className="trust-badge-icon" aria-hidden="true" />
                  <span>{isRTL ? "توصيل حتى باب المنزل" : "Doorstep Delivery"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
