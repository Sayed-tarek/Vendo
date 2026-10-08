import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import "./Dashboard.css";

export function DashboardSettings() {
  const { isRTL } = useTranslation();

  return (
    <div className="dash-card">
      <h2 className="dash-header-title">{isRTL ? "إعدادات المنصة" : "Platform Settings"}</h2>
      <p className="dash-header-desc">
        {isRTL
          ? "تكوين الخيارات العامة للنظام، الإشعارات، ومعايير الأمان."
          : "Configure general system preferences, notifications, and security policies."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "480px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--vendo-border)" }}>
          <span style={{ fontWeight: 600 }}>{isRTL ? "وضع الصيانة" : "Maintenance Mode"}</span>
          <span className="dash-badge-status dash-badge-pending">{isRTL ? "معطل" : "Disabled"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--vendo-border)" }}>
          <span style={{ fontWeight: 600 }}>{isRTL ? "تسجيل بائعين جدد" : "Seller Registrations"}</span>
          <span className="dash-badge-status dash-badge-active">{isRTL ? "مفعل" : "Enabled"}</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardSettings;
