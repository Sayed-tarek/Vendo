import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { getHowItWorksSteps } from "../data/homeContent";

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = getHowItWorksSteps(t);

  return (
    <section id="how-it-works" className="vendo-section how-it-works-section" aria-label="How Vendo Works">
      <div className="vendo-container">
        <div className="section-head">
          <span className="section-badge">{t("navHowItWorks")}</span>
          <h2 className="section-title">{t("howTitle")}</h2>
          <p className="section-subtitle">{t("howSubtitle")}</p>
        </div>

        <div className="how-steps-grid">
          {steps.map((step) => (
            <div key={step.id} className="how-step-card">
              <span className="step-num-badge">{step.number}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
