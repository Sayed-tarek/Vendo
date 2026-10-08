import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { forgotPassword } from "@/services/authService";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    setServerError("");

    try {
      const responseData = await forgotPassword({
        email: data.email,
      });

      console.log("Forgot Password Response:", responseData);
      toast.success(responseData.message || "تم إرسال رمز التحقق إلى بريدك الإلكتروني");

      // Pass email to verify-otp step via navigation state
      navigate("/verify-otp", {
        state: { email: data.email },
      });
    } catch (error) {
      console.error("Forgot Password Error:", error);

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
          "حدث خطأ أثناء إرسال رمز التحقق، يرجى المحاولة مرة أخرى.";
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
          <div className="auth-flow-icon">🔑</div>
          <h1 className="auth-flow-title">نسيت كلمة المرور؟</h1>
          <p className="auth-flow-subtitle">
            أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق (OTP) لإعادة تعيين كلمة المرور
          </p>
        </div>

        {serverError && (
          <div className="general-alert" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-flow-form" noValidate>
          {/* البريد الإلكتروني */}
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
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "صيغة البريد الإلكتروني غير صحيحة",
                  },
                })}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>جاري إرسال الرمز...</span>
              </>
            ) : (
              <span>إرسال رمز التحقق</span>
            )}
          </button>
        </form>

        <div className="auth-flow-footer">
          <Link to="/login" className="auth-flow-link">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
