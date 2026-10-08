import React from "react";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";

export function CTASection() {
  const { t, isRTL } = useTranslation();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="cta-section" aria-label="Call to Action">
      <div className="vendo-container">
        <div className="cta-banner">
          <h2 className="cta-title">{t("ctaTitle")}</h2>
          <p className="cta-subtitle">{t("ctaSubtitle")}</p>

          <div className="cta-actions-wrap">
            <button
              type="button"
              className="btn-cta-main"
              onClick={() => scrollToSection("hero")}
            >
              <span>{t("ctaButton")}</span>
              {isRTL ? <FiArrowLeft /> : <FiArrowRight />}
            </button>

            <button
              type="button"
              className="btn-cta-secondary"
              onClick={() => scrollToSection("how-it-works")}
            >
              <span>{t("ctaLearnMore")}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
