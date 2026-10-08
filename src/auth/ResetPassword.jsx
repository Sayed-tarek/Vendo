import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { resetPassword } from "@/services/authService";
import "./ForgotPassword.css";

function ResetPassword() {
  const [serverError, setServerError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve email and otp passed from VerifyOtp page
  const userEmail = location.state?.email || "";
  const userOtp = location.state?.otp || "";

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: userEmail,
      otp: userOtp,
      password: "",
      password_confirmation: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setServerError("");

    if (!data.email || !data.otp) {
      const msg = "بيانات التحقق غير مكتملة، يرجى إعادة طلب رمز التحقق.";
      setServerError(msg);
      toast.error(msg);
      return;
    }

    try {
      const responseData = await resetPassword({
        email: data.email,
        otp: data.otp,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      console.log("Reset Password Response:", responseData);
      toast.success(responseData.message || "تم تغيير كلمة المرور بنجاح");

      // Navigate to login page without logging in automatically
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Reset Password Error:", error);

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
          "حدث خطأ أثناء إعادة تعيين كلمة المرور، يرجى المحاولة مرة أخرى.";
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
    <div className="auth-flow-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="auth-flow-card">
        <div className="auth-flow-header">
          <div className="auth-flow-icon">🔒</div>
          <h1 className="auth-flow-title">إنشاء كلمة مرور جديدة</h1>
          <p className="auth-flow-subtitle">
            أدخل كلمة المرور الجديدة لحسابك وقم بتأكيدها
          </p>
          {userEmail && (
            <span className="auth-flow-email-badge">{userEmail}</span>
          )}
        </div>

        {serverError && (
          <div className="general-alert" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-flow-form" noValidate>
          {/* حقول مخفية للـ email والـ otp إذا توفرت من الخطوة السابقة */}
          {!userEmail && (
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                البريد الإلكتروني <span className="required-mark">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                  placeholder="example@domain.com"
                  disabled={isSubmitting}
                  {...register("email", {
                    required: "البريد الإلكتروني مطلوب",
                  })}
                />
              </div>
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>
          )}

          {!userOtp && (
            <div className="form-group">
              <label className="form-label" htmlFor="otp">
                رمز التحقق (OTP) <span className="required-mark">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="otp"
                  type="text"
                  className={`form-input ${errors.otp ? "input-error" : ""}`}
                  placeholder="أدخل رمز التحقق"
                  disabled={isSubmitting}
                  {...register("otp", {
                    required: "رمز التحقق مطلوب",
                  })}
                />
              </div>
              {errors.otp && (
                <span className="error-message">{errors.otp.message}</span>
              )}
            </div>
          )}

          {/* كلمة المرور الجديدة */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              كلمة المرور الجديدة <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                className={`form-input ${errors.password ? "input-error" : ""}`}
                placeholder="********"
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
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="form-group">
            <label className="form-label" htmlFor="password_confirmation">
              تأكيد كلمة المرور <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="password_confirmation"
                type="password"
                className={`form-input ${errors.password_confirmation ? "input-error" : ""}`}
                placeholder="********"
                disabled={isSubmitting}
                {...register("password_confirmation", {
                  required: "تأكيد كلمة المرور مطلوب",
                  validate: (value) =>
                    value === password || "كلمة المرور غير متطابقة",
                })}
              />
            </div>
            {errors.password_confirmation && (
              <span className="error-message">
                {errors.password_confirmation.message}
              </span>
            )}
          </div>

          {/* زر تغيير كلمة المرور */}
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>جاري حفظ كلمة المرور...</span>
              </>
            ) : (
              <span>تغيير كلمة المرور</span>
            )}
          </button>
        </form>

        <div className="auth-flow-footer">
          <Link to="/login" className="auth-flow-link">
            ← إلغاء والعودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
