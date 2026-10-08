import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FiArrowUp } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import "./Footer.css";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="vendo-footer" aria-label="Vendo Footer">
      <div className="vendo-container">
        <div className="footer-grid">
          {/* Column 1: Brand Info */}
          <div className="footer-brand">
            <Link to="/" className="footer-brand-link" onClick={scrollToTop}>
              <div className="footer-brand-logo">V</div>
              <span className="footer-brand-name">{t("brandName")}</span>
            </Link>
            <p className="footer-tagline">"{t("brandTagline")}"</p>
            <p className="footer-desc">{t("footerDesc")}</p>

            {/* Social Icons */}
            <div className="footer-social-list" aria-label="Social Media Links">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="YouTube"
              >
                <FaYoutube />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">{t("footerColQuick")}</h3>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("hero")}>
                  {t("navHome")}
                </button>
              </li>
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("benefits")}>
                  {t("navBenefits")}
                </button>
              </li>
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("how-it-works")}>
                  {t("navHowItWorks")}
                </button>
              </li>
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("faq")}>
                  {t("navFaq")}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Information */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">{t("footerColInfo")}</h3>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("experience")}>
                  {t("footerAboutUs")}
                </button>
              </li>
              <li className="footer-link-item">
                <a href="#privacy" onClick={(e) => e.preventDefault()}>
                  {t("footerPrivacy")}
                </a>
              </li>
              <li className="footer-link-item">
                <a href="#terms" onClick={(e) => e.preventDefault()}>
                  {t("footerTerms")}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Customer Support */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">{t("footerColSupport")}</h3>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <a href="mailto:support@vendo.com">
                  {t("footerContact")}
                </a>
              </li>
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("faq")}>
                  {t("footerHelpCenter")}
                </button>
              </li>
              <li className="footer-link-item">
                <button type="button" onClick={() => scrollToSection("faq")}>
                  {t("navFaq")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} {t("brandName")}. {t("footerRights")}
          </p>

          <button
            type="button"
            className="footer-back-to-top"
            onClick={scrollToTop}
            aria-label={t("footerBackToTop")}
          >
            <span>{t("footerBackToTop")}</span>
            <FiArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
