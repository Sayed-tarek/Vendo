import React from "react";
import { FiCheckCircle, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import experienceImg from "@/assets/images/brand-experience.jpg";

export function ExperienceSection() {
  const { t, isRTL } = useTranslation();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="experience" className="vendo-section experience-section" aria-label="Vendo Brand Experience">
      <div className="vendo-container">
        <div className="experience-grid">
          {/* Visual Column */}
          <div className="experience-media-wrap">
            <div className="experience-image-card">
              <img
                src={experienceImg}
                alt="Vendo Seamless Delivery and Customer Experience"
                className="experience-img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Content Column */}
          <div className="experience-content">
            <span className="section-badge">{t("expBadge")}</span>
            <h2 className="experience-title">{t("expTitle")}</h2>
            <p className="experience-desc">{t("expDesc")}</p>

            <div className="experience-points-list">
              <div className="experience-point-item">
                <FiCheckCircle className="point-icon-check" />
                <span>{t("expPoint1")}</span>
              </div>
              <div className="experience-point-item">
                <FiCheckCircle className="point-icon-check" />
                <span>{t("expPoint2")}</span>
              </div>
              <div className="experience-point-item">
                <FiCheckCircle className="point-icon-check" />
                <span>{t("expPoint3")}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary-hero"
              onClick={() => scrollToSection("how-it-works")}
            >
              <span>{t("expCta")}</span>
              {isRTL ? <FiArrowLeft /> : <FiArrowRight />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExperienceSection;
