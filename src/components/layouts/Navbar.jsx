import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiLogIn,
  FiMenu,
  FiX,
  FiGlobe,
  FiGrid,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getWishlist, getCart } from "@/modules/Products/utils/storefrontState";
import "./Navbar.css";

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { t, language, toggleLanguage } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCart().length);
  const [wishlistCount, setWishlistCount] = useState(() => getWishlist().length);
  const location = useLocation();

  // Listen to Cart & Wishlist update events
  useEffect(() => {
    const handleCartUpdate = (e) => {
      setCartCount(e.detail?.count ?? getCart().length);
    };
    const handleWishlistUpdate = (e) => {
      setWishlistCount(e.detail?.count ?? getWishlist().length);
    };

    window.addEventListener("vendo_cart_updated", handleCartUpdate);
    window.addEventListener("vendo_wishlist_updated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("vendo_cart_updated", handleCartUpdate);
      window.removeEventListener("vendo_wishlist_updated", handleWishlistUpdate);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  // Close drawer on route change or language change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname, language]);

  // Automatically close mobile drawer if resized to desktop screen
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className={`vendo-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="vendo-container header-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-link" aria-label="Vendo Homepage">
          <div className="brand-badge-icon">V</div>
          <div className="brand-text-wrap">
            <span className="brand-name">{t("brandName")}</span>
            <span className="brand-sub">Marketplace</span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Icons */}
        <nav className="header-nav" aria-label="Main Navigation">
          {/* 1. Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link-item ${isActive ? "active" : ""}`
            }
          >
            <FiHome className="nav-link-icon" />
            <span>{t("navHome")}</span>
          </NavLink>

          {/* 2. Shop / Store */}
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `nav-link-item ${isActive || location.pathname === "/shop" ? "active" : ""}`
            }
          >
            <FiShoppingBag className="nav-link-icon" />
            <span>{t("navShop")}</span>
          </NavLink>

          {/* 3. Cart */}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `nav-link-item ${isActive ? "active" : ""}`
            }
          >
            <FiShoppingCart className="nav-link-icon" />
            <span>{t("cart")}</span>
            <span className="nav-badge-pill">{cartCount}</span>
          </NavLink>

          {/* 4. Wishlist */}
          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              `nav-link-item ${isActive ? "active" : ""}`
            }
          >
            <FiHeart className="nav-link-icon" />
            <span>{t("wishlist")}</span>
            <span className="nav-badge-pill">{wishlistCount}</span>
          </NavLink>
        </nav>

        {/* Header Right Actions (Profile / Auth, Admin Dashboard, Language) */}
        <div className="header-actions">
          {/* Desktop Only: Admin Dashboard Link (Only visible if user.role === 'admin') */}
          {isAuthenticated && user?.role === "admin" && (
            <Link
              to="/dashboard"
              className="btn-dashboard-link desktop-only-action"
              title={t("dashboard")}
            >
              <FiGrid />
              <span>{t("dashboard")}</span>
            </Link>
          )}

          {/* Desktop Only: Profile or Login */}
          <div className="desktop-only-action">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="user-profile-pill"
                title={t("profile")}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="user-avatar-mini"
                  />
                ) : (
                  <FiUser className="nav-link-icon" />
                )}
                <span>
                  {user?.name ? user.name.split(" ")[0] : t("profile")}
                </span>
              </Link>
            ) : (
              <Link to="/login" style={{color:"white"}} className="btn-nav-login" title={t("signIn")}>
                <FiLogIn size={17} />
                <span>{t("signIn")}</span>
              </Link>
            )}
          </div>

          {/* Desktop Only: Language Switcher */}
          <button
            type="button"
            className="btn-lang-switch desktop-only-action"
            onClick={toggleLanguage}
            title={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            aria-label="Toggle Language"
          >
            <FiGlobe />
            <span>{t("langName")}</span>
          </button>

          {/* Mobile Hamburger Toggle (Visible on Small Screens) */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
          >
            <FiMenu />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Rendered via Portal directly to body for 100% reliable z-index & positioning */}
      {typeof document !== "undefined" &&
        mobileDrawerOpen &&
        createPortal(
          <>
            {/* Mobile Drawer Overlay */}
            <div
              className={`mobile-drawer-overlay ${mobileDrawerOpen ? "open" : ""}`}
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden={!mobileDrawerOpen}
            />

            {/* Mobile Sidebar / Drawer */}
            <aside
              className={`mobile-drawer ${mobileDrawerOpen ? "open" : ""}`}
              aria-label="Mobile Navigation Sidebar"
            >
              {/* Drawer Top Bar */}
              <div className="drawer-header">
                <div className="brand-link">
                  <div className="brand-badge-icon">V</div>
                  <span className="brand-name">{t("brandName")}</span>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <FiX />
                </button>
              </div>

              {/* Profile Section in Sidebar (User Card or Login/Register) */}
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="drawer-user-card"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <div className="drawer-user-info">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="drawer-user-avatar"
                      />
                    ) : (
                      <div className="drawer-user-avatar-placeholder">
                        <FiUser />
                      </div>
                    )}
                    <div className="drawer-user-details">
                      <span className="drawer-user-name">
                        {user?.name || t("profile")}
                      </span>
                      <span className="drawer-user-role">
                        {user?.email || (user?.role === "admin" ? t("dashboard") : t("profile"))}
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="drawer-guest-actions">
                  <Link
                    to="/login"
                    className="btn-drawer-login"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <FiLogIn size={18} />
                    <span>{t("signIn")}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="btn-drawer-register"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <FiUser size={18} />
                    <span>{t("signUp")}</span>
                  </Link>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <nav className="drawer-nav">
                {/* 1. Home */}
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `drawer-nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <FiHome className="drawer-nav-icon" />
                  <span>{t("navHome")}</span>
                </NavLink>

                {/* 2. Shop */}
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `drawer-nav-link ${isActive || location.pathname === "/shop" ? "active" : ""}`
                  }
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <FiShoppingBag className="drawer-nav-icon" />
                  <span>{t("navShop")}</span>
                </NavLink>

                {/* 3. Cart */}
                <NavLink
                  to="/cart"
                  className={({ isActive }) =>
                    `drawer-nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <FiShoppingCart className="drawer-nav-icon" />
                  <span style={{ flex: 1 }}>{t("cart")}</span>
                  <span className="nav-badge-pill">{cartCount}</span>
                </NavLink>

                {/* 4. Wishlist */}
                <NavLink
                  to="/wishlist"
                  className={({ isActive }) =>
                    `drawer-nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <FiHeart className="drawer-nav-icon" />
                  <span style={{ flex: 1 }}>{t("wishlist")}</span>
                  <span className="nav-badge-pill">{wishlistCount}</span>
                </NavLink>

                {/* 5. Profile page link if authenticated */}
                {isAuthenticated && (
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `drawer-nav-link ${isActive ? "active" : ""}`
                    }
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <FiUser className="drawer-nav-icon" />
                    <span>{t("profile")}</span>
                  </NavLink>
                )}

                {/* 6. Admin Dashboard Link in Mobile Drawer */}
                {isAuthenticated && user?.role === "admin" && (
                  <NavLink
                    to="/dashboard"
                    className="drawer-nav-link"
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      borderColor: "#334155",
                    }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <FiGrid className="drawer-nav-icon" />
                    <span>{t("dashboard")}</span>
                  </NavLink>
                )}
              </nav>

              {/* Mobile Drawer Footer with Language Switcher */}
              <div className="drawer-footer">
                <button
                  type="button"
                  className="drawer-lang-btn"
                  onClick={toggleLanguage}
                  aria-label="Toggle Language"
                >
                  <FiGlobe />
                  <span>{t("langName")}</span>
                </button>
              </div>
            </aside>
          </>,
          document.body
        )}
    </header>
  );
}

export default Navbar;
