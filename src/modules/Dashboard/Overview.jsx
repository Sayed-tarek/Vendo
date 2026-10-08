import React from "react";
import { FiUsers, FiPackage, FiShoppingBag, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import "./Dashboard.css";

export function DashboardOverview() {
  const { user } = useAuth();
  const { isRTL } = useTranslation();

  return (
    <div>
      <div className="dash-card">
        <h2 className="dash-header-title">
          {isRTL ? `مرحباً بك، ${user?.name || "المسؤول"}` : `Welcome back, ${user?.name || "Admin"}`}
        </h2>
        <p className="dash-header-desc">
          {isRTL
            ? "نظرة عامة على مؤشرات الأداء الحالية لمنصة Vendo."
            : "Overview of current platform performance indicators."}
        </p>

        {/* Stats Grid */}
        <div className="dash-stats-grid">
          <div className="stat-metric-card">
            <div className="stat-icon-wrap stat-icon-blue">
              <FiUsers />
            </div>
            <div className="stat-content">
              <span className="stat-number">2,840</span>
              <span className="stat-label">
                {isRTL ? "إجمالي المستخدمين" : "Total Users"}
              </span>
            </div>
          </div>

          <div className="stat-metric-card">
            <div className="stat-icon-wrap stat-icon-green">
              <FiPackage />
            </div>
            <div className="stat-content">
              <span className="stat-number">1,420</span>
              <span className="stat-label">
                {isRTL ? "المنتجات النشطة" : "Active Products"}
              </span>
            </div>
          </div>

          <div className="stat-metric-card">
            <div className="stat-icon-wrap stat-icon-amber">
              <FiShoppingBag />
            </div>
            <div className="stat-content">
              <span className="stat-number">389</span>
              <span className="stat-label">
                {isRTL ? "الطلبات الجارية" : "Pending Orders"}
              </span>
            </div>
          </div>

          <div className="stat-metric-card">
            <div className="stat-icon-wrap stat-icon-purple">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <span className="stat-number">99.4%</span>
              <span className="stat-label">
                {isRTL ? "كفاءة المنصة" : "System Uptime"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Card */}
      <div className="dash-card">
        <h3 className="dash-header-title" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
          {isRTL ? "آخر العمليات المسجلة" : "Recent Platform Activity"}
        </h3>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>{isRTL ? "المعرف" : "ID"}</th>
                <th>{isRTL ? "العملية" : "Action"}</th>
                <th>{isRTL ? "المستخدم" : "User"}</th>
                <th>{isRTL ? "الحالة" : "Status"}</th>
                <th>{isRTL ? "التاريخ" : "Timestamp"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#ACT-1092</td>
                <td>{isRTL ? "تحديث إعدادات النظام" : "System Settings Update"}</td>
                <td>{user?.name || "Admin"}</td>
                <td>
                  <span className="dash-badge-status dash-badge-active">
                    {isRTL ? "مكتمل" : "Completed"}
                  </span>
                </td>
                <td>2026-09-28 07:12</td>
              </tr>
              <tr>
                <td>#ACT-1091</td>
                <td>{isRTL ? "تسجيل مستخدم جديد" : "New User Registration"}</td>
                <td>sara.ahmed@example.com</td>
                <td>
                  <span className="dash-badge-status dash-badge-active">
                    {isRTL ? "نشط" : "Active"}
                  </span>
                </td>
                <td>2026-09-28 06:45</td>
              </tr>
              <tr>
                <td>#ACT-1090</td>
                <td>{isRTL ? "طلب تحقق جديد" : "Verification Request"}</td>
                <td>seller.corp@example.com</td>
                <td>
                  <span className="dash-badge-status dash-badge-pending">
                    {isRTL ? "قيد المراجعة" : "Under Review"}
                  </span>
                </td>
                <td>2026-09-28 05:30</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
