import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getProfile, logoutUser, isUserActive } from "@/services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Immediately purge inactive user session
      if (parsed && !isUserActive(parsed)) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount / refresh
  useEffect(() => {
    // Clean up any legacy localStorage auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const verifyAuth = async () => {
      const storedToken = sessionStorage.getItem("token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getProfile();
        // Backend returns: { success: true, data: user }
        if (response && response.data) {
          const profileUser = response.data;

          // Check if currently authenticated user has been deactivated by admin
          if (!isUserActive(profileUser)) {
            console.warn("User account is inactive. Terminating active session.");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            setToken(null);
            setUser(null);
            toast.error(
              document.documentElement.dir === "ltr"
                ? "Your account has been deactivated by the administrator."
                : "تم تعطيل حسابك من الإدارة."
            );
            return;
          }

          setUser(profileUser);
          sessionStorage.setItem("user", JSON.stringify(profileUser));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // If token is invalid or expired (401), clean up
        if (error.response && error.response.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback((authData) => {
    // Expected authData: { token, data: user }
    const userObj = authData?.data || authData?.user;

    // Strict safety guard: reject session persistence for inactive user
    if (userObj && !isUserActive(userObj)) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setToken(null);
      setUser(null);
      return false;
    }

    if (authData?.token) {
      sessionStorage.setItem("token", authData.token);
      setToken(authData.token);
    }
    if (userObj) {
      sessionStorage.setItem("user", JSON.stringify(userObj));
      setUser(userObj);
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn("Backend logout warning:", error);
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    if (userData) {
      if (!isUserActive(userData)) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setToken(null);
        setUser(null);
        return;
      }
      sessionStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user && isUserActive(user)),
    isLoading,
    isAdmin: user?.role === "admin",
    hasRole: (role) => user?.role === role,
    login,
    logout,
    updateUser,
    isUserActive,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
