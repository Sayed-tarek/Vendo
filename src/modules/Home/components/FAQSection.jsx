import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { getFaqData } from "../data/homeContent";

export function FAQSection() {
  const { t } = useTranslation();
  const faqs = getFaqData(t);
  const [openIndex, setOpenIndex] = useState(0); // first item open by default

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section id="faq" className="vendo-section faq-section" aria-label="Frequently Asked Questions">
      <div className="vendo-container">
        <div className="section-head">
          <span className="section-badge">{t("navFaq")}</span>
          <h2 className="section-title">{t("faqTitle")}</h2>
          <p className="section-subtitle">{t("faqSubtitle")}</p>
        </div>

        <div className="faq-accordion-wrap">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className={`faq-item ${isOpen ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <span>{faq.question}</span>
                  <FiChevronDown className="faq-chevron" aria-hidden="true" />
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className="faq-answer-panel"
                    role="region"
                  >
                    <p style={{ margin: 0 }}>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
