import React from "react";
import HeroSection from "./components/HeroSection";
import BenefitsBar from "./components/BenefitsBar";
import WhyVendo from "./components/WhyVendo";
import HowItWorks from "./components/HowItWorks";
import ExperienceSection from "./components/ExperienceSection";
import Testimonials from "./components/Testimonials";
import CTASection from "./components/CTASection";
import FAQSection from "./components/FAQSection";
import "./Home.css";

/**
 * Vendo Brand Homepage Entry Component.
 * Orchestrates all modular brand sections without tying to specific product categories.
 */
export function HomePage() {
  return (
    <div className="vendo-homepage">
      <HeroSection />
      <BenefitsBar />
      <WhyVendo />
      <HowItWorks />
      <ExperienceSection />
      <Testimonials />
      <CTASection />
      <FAQSection />
    </div>
  );
}

export default HomePage;
