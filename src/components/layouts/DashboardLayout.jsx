import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiPackage,
  FiShoppingBag,
  FiLayers,
  FiSliders,
  FiStar,
  FiSettings,
  FiArrowRight,
  FiArrowLeft,
  FiUser,
  FiShield,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import LogoutButton from "@/components/layouts/LogoutButton";
import "./DashboardLayout.css";

/**
 * DashboardLayout for Vendo Admin Panel.
 * Rendered exclusively within ProtectedRoute (requiredRole="admin").
 */
export function DashboardLayout() {
  const { user } = useAuth();
  const { isRTL, language, toggleLanguage } = useTranslation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change or language switch
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, language]);

  const navLinks = [
    { to: "/dashboard", end: true, icon: FiGrid, label: isRTL ? "نظرة عامة" : "Overview" },
    { to: "/dashboard/users", icon: FiUsers, label: isRTL ? "المستخدمين" : "Users" },
    { to: "/dashboard/products", icon: FiPackage, label: isRTL ? "المنتجات" : "Products" },
    { to: "/dashboard/orders", icon: FiShoppingBag, label: isRTL ? "الطلبات" : "Orders" },
    { to: "/dashboard/categories", icon: FiLayers, label: isRTL ? "التصنيفات" : "Categories" },
    { to: "/dashboard/colors-sizes", icon: FiSliders, label: isRTL ? "خيارات المنتجات" : "Product Options" },
    { to: "/dashboard/reviews", icon: FiStar, label: isRTL ? "التقييمات" : "Reviews" },
    { to: "/dashboard/settings", icon: FiSettings, label: isRTL ? "الإعدادات" : "Settings" },
  ];

  return (
    <div
      className={`dashboard-container ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Mobile Backdrop for drawer overlay */}
      {isMobileSidebarOpen && (
        <div
          className="dashboard-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${isMobileSidebarOpen ? "mobile-open" : ""}`}
        aria-label="Admin Navigation Sidebar"
      >
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="sidebar-brand-badge">V</div>
            <div>
              <div className="sidebar-brand-title">Vendo Admin</div>
              <div className="sidebar-brand-subtitle">
                {isRTL ? "لوحة التحكم المركزية" : "Central Control"}
              </div>
            </div>
          </div>

          {/* Close button inside sidebar on mobile */}
          <button
            type="button"
            className="btn-mobile-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label={isRTL ? "إغلاق القائمة" : "Close Menu"}
          >
            <FiX />
          </button>
        </div>

        {/* Current Admin User Info */}
        <div className="sidebar-user-card">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Admin"}
              className="sidebar-user-avatar"
            />
          ) : (
            <div
              className="sidebar-user-avatar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#334155",
                color: "#ffffff",
              }}
            >
              <FiUser />
            </div>
          )}
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || "Admin User"}</span>
            <span className="sidebar-role-badge">
              <FiShield style={{ display: "inline", verticalAlign: "middle" }} />{" "}
              {user?.role || "admin"}
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <Link
            to="/"
            className="btn-back-to-site"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
            <span>{isRTL ? "العودة للمتجر" : "Back to Store"}</span>
          </Link>

          <LogoutButton
            style={{
              width: "100%",
              padding: "0.55rem",
              borderRadius: "var(--vendo-radius-md)",
              fontSize: "0.86rem",
            }}
          >
            {isRTL ? "تسجيل الخروج" : "Sign Out"}
          </LogoutButton>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-area">
        <header className="dashboard-topbar">
          <div className="topbar-left-group">
            {/* Mobile Hamburger toggle button */}
            <button
              type="button"
              className="btn-mobile-sidebar-toggle"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              aria-label={isRTL ? "تبديل القائمة الجانبية" : "Toggle Sidebar"}
            >
              <FiMenu />
            </button>

            <h1 className="topbar-title">
              {isRTL ? "لوحة الإدارة والتحكم" : "Admin Dashboard"}
            </h1>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="btn-lang-switch"
              onClick={toggleLanguage}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              <span>{language === "ar" ? "English" : "العربية"}</span>
            </button>
          </div>
        </header>

        <main className="dashboard-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
