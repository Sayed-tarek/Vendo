import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

/**
 * Reusable LogoutButton component
 * Calls POST /api/logout, clears session storage and state, then redirects to /login.
 */
export function LogoutButton({ className, style, children }) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const defaultStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.375rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: isLoggingOut ? "not-allowed" : "pointer",
    opacity: isLoggingOut ? 0.7 : 1,
    transition: "background-color 0.2s",
    ...style,
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      style={className ? style : defaultStyle}
    >
      {isLoggingOut ? (
        <span>جاري تسجيل الخروج...</span>
      ) : (
        children || "تسجيل الخروج"
      )}
    </button>
  );
}

export default LogoutButton;
