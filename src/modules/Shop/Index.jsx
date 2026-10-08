import React from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";

export function ShopPage() {
  const { t, isRTL } = useTranslation();

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", backgroundColor: "var(--vendo-bg-alt)" }}>
      <div style={{ maxWidth: "560px", width: "100%", backgroundColor: "#ffffff", borderRadius: "var(--vendo-radius-lg)", border: "1px solid var(--vendo-border)", padding: "3rem 2rem", textAlign: "center", boxShadow: "var(--vendo-shadow-sm)" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "var(--vendo-primary-light)", color: "var(--vendo-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1.5rem" }}>
          <FiShoppingBag />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--vendo-dark)", marginBottom: "0.75rem" }}>
          {isRTL ? "متجر Vendo" : "Vendo Store"}
        </h1>
        <p style={{ color: "var(--vendo-gray-muted)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
          {isRTL
            ? "سيتم إطلاق كتالوج المنتجات قريبًا مع أفضل الخيارات والعروض الحصرية."
            : "The products catalog will be launched soon with top choices and exclusive offers."}
        </p>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.75rem",
            backgroundColor: "var(--vendo-primary)",
            color: "#ffffff",
            borderRadius: "var(--vendo-radius-md)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <span>{isRTL ? "العودة للرئيسية" : "Back to Home"}</span>
          {isRTL ? <FiArrowLeft /> : <FiArrowRight />}
        </Link>
      </div>
    </div>
  );
}

export default ShopPage;
