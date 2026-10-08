import React from "react";
import { FiCompass, FiCheckCircle, FiLock, FiMessageSquare } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { getWhyVendoCards } from "../data/homeContent";

const iconMap = {
  FiCompass,
  FiCheckCircle,
  FiLock,
  FiMessageSquare,
};

export function WhyVendo() {
  const { t } = useTranslation();
  const cards = getWhyVendoCards(t);

  return (
    <section id="why-vendo" className="vendo-section why-vendo-section" aria-label="Why Choose Vendo">
      <div className="vendo-container">
        <div className="section-head">
          <span className="section-badge">{t("whyTitle")}</span>
          <h2 className="section-title">{t("whyTitle")}</h2>
          <p className="section-subtitle">{t("whySubtitle")}</p>
        </div>

        <div className="why-grid">
          {cards.map((card) => {
            const Icon = iconMap[card.icon] || FiCheckCircle;
            return (
              <div key={card.id} className="why-card">
                <div className="why-card-header">
                  <div className="why-icon-box" aria-hidden="true">
                    <Icon />
                  </div>
                  <span className="why-card-tag">{card.tag}</span>
                </div>
                <h3 className="why-card-title">{card.title}</h3>
                <p className="why-card-desc">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyVendo;
