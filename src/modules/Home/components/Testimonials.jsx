import React from "react";
import { FaStar } from "react-icons/fa";
import { useTranslation } from "@/hooks/useTranslation";
import { getTestimonialsData } from "../data/homeContent";

export function Testimonials() {
  const { t } = useTranslation();
  const testimonials = getTestimonialsData(t);

  return (
    <section id="testimonials" className="vendo-section testimonials-section" aria-label="Customer Testimonials">
      <div className="vendo-container">
        <div className="section-head">
          <span className="section-badge">{t("navTestimonials")}</span>
          <h2 className="section-title">{t("testTitle")}</h2>
          <p className="section-subtitle">{t("testSubtitle")}</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <div key={item.id} className="testimonial-card">
              <div>
                <div className="star-rating-row" aria-label={`Rating: ${item.rating} out of 5 stars`}>
                  {[...Array(item.rating)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
                <blockquote className="testimonial-quote">
                  "{item.quote}"
                </blockquote>
              </div>

              <div className="testimonial-author">
                <div className="author-avatar" aria-hidden="true">
                  {item.initials}
                </div>
                <div className="author-info">
                  <cite className="author-name" style={{ fontStyle: "normal" }}>
                    {item.name}
                  </cite>
                  <span className="author-meta">{item.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
