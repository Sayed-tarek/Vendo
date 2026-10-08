/**
 * Static Data Architecture for Vendo Brand Homepage.
 * Provides clean, extensible data models referenced by translation keys
 * or direct structured content, allowing seamless future API swapping.
 */

export const getBenefitsData = (t) => [
  {
    id: "benefit-ease",
    icon: "FaRegSmile",
    title: t("benefit1Title"),
    description: t("benefit1Desc"),
  },
  {
    id: "benefit-choices",
    icon: "FaLayerGroup",
    title: t("benefit2Title"),
    description: t("benefit2Desc"),
  },
  {
    id: "benefit-security",
    icon: "FaShieldAlt",
    title: t("benefit3Title"),
    description: t("benefit3Desc"),
  },
  {
    id: "benefit-support",
    icon: "FaHeadset",
    title: t("benefit4Title"),
    description: t("benefit4Desc"),
  },
];

export const getWhyVendoCards = (t) => [
  {
    id: "why-ease",
    icon: "FiCompass",
    title: t("whyCard1Title"),
    description: t("whyCard1Desc"),
    tag: "01",
  },
  {
    id: "why-convenience",
    icon: "FiCheckCircle",
    title: t("whyCard2Title"),
    description: t("whyCard2Desc"),
    tag: "02",
  },
  {
    id: "why-trust",
    icon: "FiLock",
    title: t("whyCard3Title"),
    description: t("whyCard3Desc"),
    tag: "03",
  },
  {
    id: "why-support",
    icon: "FiMessageSquare",
    title: t("whyCard4Title"),
    description: t("whyCard4Desc"),
    tag: "04",
  },
];

export const getHowItWorksSteps = (t) => [
  {
    id: "step-discover",
    number: t("step1Num"),
    title: t("step1Title"),
    description: t("step1Desc"),
    badge: "01",
  },
  {
    id: "step-select",
    number: t("step2Num"),
    title: t("step2Title"),
    description: t("step2Desc"),
    badge: "02",
  },
  {
    id: "step-order",
    number: t("step3Num"),
    title: t("step3Title"),
    description: t("step3Desc"),
    badge: "03",
  },
  {
    id: "step-receive",
    number: t("step4Num"),
    title: t("step4Title"),
    description: t("step4Desc"),
    badge: "04",
  },
];

export const getTestimonialsData = (t) => [
  {
    id: "test-1",
    name: t("test1Name"),
    city: t("test1City"),
    quote: t("test1Quote"),
    rating: 5,
    initials: "SM",
    role: "Verified Member",
  },
  {
    id: "test-2",
    name: t("test2Name"),
    city: t("test2City"),
    quote: t("test2Quote"),
    rating: 5,
    initials: "OK",
    role: "Verified Member",
  },
  {
    id: "test-3",
    name: t("test3Name"),
    city: t("test3City"),
    quote: t("test3Quote"),
    rating: 5,
    initials: "LH",
    role: "Verified Member",
  },
];

export const getFaqData = (t) => [
  {
    id: "faq-1",
    question: t("faqQ1"),
    answer: t("faqA1"),
  },
  {
    id: "faq-2",
    question: t("faqQ2"),
    answer: t("faqA2"),
  },
  {
    id: "faq-3",
    question: t("faqQ3"),
    answer: t("faqA3"),
  },
  {
    id: "faq-4",
    question: t("faqQ4"),
    answer: t("faqA4"),
  },
  {
    id: "faq-5",
    question: t("faqQ5"),
    answer: t("faqA5"),
  },
];
