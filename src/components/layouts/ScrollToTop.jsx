import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Ensures window and main document scroll containers immediately reset to the top (0, 0)
 * whenever navigation to a new route occurs.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Reset standard browser window scroll position instantly
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    // 2. Fallbacks for documentElement and body (Safari / legacy mobile WebKit)
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Fallbacks for any potential nested overflow-y layout containers
    const dashboardMain = document.querySelector(".dashboard-main-area");
    if (dashboardMain) {
      dashboardMain.scrollTop = 0;
    }
    const dashboardBody = document.querySelector(".dashboard-content-body");
    if (dashboardBody) {
      dashboardBody.scrollTop = 0;
    }
    const siteOutlet = document.querySelector(".vendo-main-outlet");
    if (siteOutlet) {
      siteOutlet.scrollTop = 0;
    }
  }, [pathname, search]);

  return null;
}
