import React from "react";
import { FiCheckCircle, FiArrowRight, FiArrowLeft, FiShield } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import heroImg from "@/assets/images/hero-visual.jpg";

export function HeroSection() {
  const { t, isRTL } = useTranslation();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="hero-section" aria-label="Hero Section">
      <div className="vendo-container">
        <div className="hero-grid">
          {/* Hero Content Column */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>{t("heroBadge")}</span>
            </div>

            <h1 className="hero-title">
              {t("heroTitlePart1")}{" "}
              <span className="hero-title-accent">{t("heroTitlePart2")}</span>
            </h1>

            <p className="hero-subtitle">{t("heroSubtitle")}</p>

            {/* CTA Group */}
            <div className="hero-cta-group">
              <button
                type="button"
                className="btn-primary-hero"
                onClick={() => scrollToSection("how-it-works")}
              >
                <span>{t("heroPrimaryCta")}</span>
                {isRTL ? <FiArrowLeft /> : <FiArrowRight />}
              </button>

              <button
                type="button"
                className="btn-secondary-hero"
                onClick={() => scrollToSection("why-vendo")}
              >
                <span>{t("heroSecondaryCta")}</span>
              </button>
            </div>

            {/* 3 Trust Signals */}
            <div className="hero-trust-strip" aria-label="Trust Signals">
              <div className="trust-item">
                <FiCheckCircle className="trust-icon-check" />
                <span>{t("heroTrustSignal1")}</span>
              </div>
              <div className="trust-item">
                <FiCheckCircle className="trust-icon-check" />
                <span>{t("heroTrustSignal2")}</span>
              </div>
              <div className="trust-item">
                <FiCheckCircle className="trust-icon-check" />
                <span>{t("heroTrustSignal3")}</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Column */}
          <div className="hero-media-wrap">
            <div className="hero-image-card">
              <img
                src={heroImg}
                alt="Vendo Seamless Online Shopping Experience"
                className="hero-img"
                loading="eager"
              />
              {/* Floating Trust Badge */}
              <div className="hero-floating-badge">
                <div className="floating-badge-icon">
                  <FiShield />
                </div>
                <div>
                  <h3 className="floating-badge-title">{t("heroTrustSignal3")}</h3>
                  <p className="floating-badge-sub">Vendo Marketplace</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
