import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Role-Based Protected Route Guard.
 * - Handles authentication loading state gracefully.
 * - Redirects unauthenticated visitors to redirectPath (default: /login).
 * - Checks requiredRole (e.g., "admin") or allowedRoles.
 * - Redirects authenticated users with insufficient role to roleRedirectPath (default: /).
 * - Allows access only when authenticated AND user.role === requiredRole.
 */
export const ProtectedRoute = ({
  requiredRole,
  allowedRoles,
  redirectPath = "/login",
  roleRedirectPath = "/",
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Wait for auth resolution on initial load or page refresh
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#64748b",
            fontFamily: "system-ui, sans-serif",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          جاري التحقق من الصلاحيات...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated or Inactive user -> clear session and redirect to /login
  if (!isAuthenticated || (user && (user.status === false || user.status === 0 || user.status === "0" || user.status === "inactive"))) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 3. Role check: if requiredRole or allowedRoles specified
  if (requiredRole || allowedRoles) {
    const rolesList = allowedRoles || (requiredRole ? [requiredRole] : []);
    const userRole = user?.role;

    // Strict role check: user.role must match allowed role (e.g. "admin")
    const hasPermission = Boolean(userRole && rolesList.includes(userRole));

    if (!hasPermission) {
      // Authenticated user but lacks the required role -> redirect to / (not /login)
      return <Navigate to={roleRedirectPath} state={{ from: location }} replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
