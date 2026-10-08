import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { loginUser, isUserActive } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import "./Login.css";

function Login() {
  const [serverError, setServerError] = useState("");
  const { isAuthenticated, isLoading, login } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  });

  // Redirect to home/intended route if already authenticated
  const from =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ""}${location.state.from.hash || ""}`
      : "/";

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data) => {
    setServerError("");

    try {
      const responseData = await loginUser({
        login: data.login,
        password: data.password,
      });

      console.log("Login Response:", responseData);

      const returnedUser = responseData?.data || responseData?.user;

      // Business Rule: Check user.status
      // status === false -> User is INACTIVE and must NOT be allowed to login/enter
      if (returnedUser && !isUserActive(returnedUser)) {
        // Reject login on frontend: do not save session, do not save token, do not navigate
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        const inactiveMessage =
          t("accountInactiveLoginMessage") ||
          (isRTL
            ? "هذا الحساب غير نشط حاليًا، يرجى التواصل مع الإدارة."
            : "This account is currently inactive. Please contact the administrator.");

        setServerError(inactiveMessage);
        toast.error(inactiveMessage);
        return;
      }

      // Save to AuthContext & sessionStorage
      const loginSuccess = login(responseData);
      if (!loginSuccess) {
        const inactiveMessage =
          t("accountInactiveLoginMessage") ||
          (isRTL
            ? "هذا الحساب غير نشط حاليًا، يرجى التواصل مع الإدارة."
            : "This account is currently inactive. Please contact the administrator.");

        setServerError(inactiveMessage);
        toast.error(inactiveMessage);
        return;
      }

      toast.success(isRTL ? "تم تسجيل الدخول بنجاح" : "Logged in successfully");
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response) {
        const responseData = error.response.data;

        // Laravel 422 validation errors
        if (responseData && responseData.errors) {
          Object.keys(responseData.errors).forEach((field) => {
            const messages = responseData.errors[field];
            const errorMessage = Array.isArray(messages) ? messages[0] : messages;
            setError(field, {
              type: "server",
              message: errorMessage,
            });
          });
        }

        const message =
          responseData?.message ||
          "بيانات تسجيل الدخول غير صحيحة، يرجى المحاولة مرة أخرى.";
        setServerError(message);
        toast.error(message);
      } else if (error.request) {
        const netMsg = "تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت.";
        setServerError(netMsg);
        toast.error(netMsg);
      } else {
        const genMsg = error.message || "حدث خطأ غير متوقع.";
        setServerError(genMsg);
        toast.error(genMsg);
      }
    }
  };

  return (
    <div className="login-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">تسجيل الدخول</h1>
          <p className="login-subtitle">أدخل بيانات حسابك للمتابعة</p>
        </div>

        {serverError && (
          <div className="general-alert" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
          {/* الحساب (بريد أو هاتف) */}
          <div className="form-group">
            <label className="form-label" htmlFor="login">
              البريد الإلكتروني أو رقم الهاتف <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="login"
                type="text"
                className={`form-input ${errors.login ? "input-error" : ""}`}
                placeholder="البريد الإلكتروني أو رقم الهاتف"
                disabled={isSubmitting}
                {...register("login", {
                  required: "البريد الإلكتروني أو رقم الهاتف مطلوب",
                })}
              />
            </div>
            {errors.login && (
              <span className="error-message">{errors.login.message}</span>
            )}
          </div>

          {/* كلمة المرور */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              كلمة المرور <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                className={`form-input ${errors.password ? "input-error" : ""}`}
                placeholder="كلمة المرور"
                disabled={isSubmitting}
                {...register("password", {
                  required: "كلمة المرور مطلوبة",
                  minLength: {
                    value: 8,
                    message: "كلمة المرور يجب ألا تقل عن 8 أحرف",
                  },
                })}
              />
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
            <div style={{ textAlign: "left", marginTop: "0.25rem" }}>
              <Link
                to="/forgot-password"
                style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>


          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          ليس لديك حساب؟
          <Link to="/register" className="login-link">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
