import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Main application layout wrapping shared Navbar, page outlet, and Footer.
 */
export function MainLayout() {
  return (
    <div className="vendo-site-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main className="vendo-main-outlet" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
