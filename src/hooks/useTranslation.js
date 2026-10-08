import { useLanguageContext } from "@/context/LanguageContext";

/**
 * Custom hook to access internationalization state, direction, and translation helper.
 * @returns {{ language: string, direction: string, isRTL: boolean, toggleLanguage: () => void, setLanguage: (lang: string) => void, t: (key: string) => string }}
 */
export const useTranslation = () => {
  return useLanguageContext();
};

export default useTranslation;
