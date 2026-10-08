import React from "react";
import { FiSmile, FiLayers, FiShield, FiHeadphones } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { getBenefitsData } from "../data/homeContent";

const iconMap = {
  FaRegSmile: FiSmile,
  FaLayerGroup: FiLayers,
  FaShieldAlt: FiShield,
  FaHeadset: FiHeadphones,
};

export function BenefitsBar() {
  const { t } = useTranslation();
  const benefits = getBenefitsData(t);

  return (
    <section id="benefits" className="benefits-bar-section" aria-label="Vendo Platform Benefits">
      <div className="vendo-container">
        <div className="benefits-grid">
          {benefits.map((item) => {
            const IconComponent = iconMap[item.icon] || FiSmile;
            return (
              <div key={item.id} className="benefit-item">
                <div className="benefit-icon-box" aria-hidden="true">
                  <IconComponent />
                </div>
                <div className="benefit-info">
                  <h3 className="benefit-title">{item.title}</h3>
                  <p className="benefit-desc">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BenefitsBar;
