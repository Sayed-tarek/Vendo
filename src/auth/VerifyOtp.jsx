import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { verifyOtp, forgotPassword } from "@/services/authService";
import "./ForgotPassword.css";

function VerifyOtp() {
  const [serverError, setServerError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve email passed from ForgotPassword page
  const userEmail = location.state?.email || "";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: userEmail,
      otp: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");

    try {
      const responseData = await verifyOtp({
        email: data.email,
        otp: data.otp.trim(),
      });

      console.log("Verify OTP Response:", responseData);
      toast.success(responseData.message || "تم تأكيد الرمز بنجاح");

      // Pass email and otp to reset-password step
      navigate("/reset-password", {
        state: {
          email: data.email,
          otp: data.otp.trim(),
        },
      });
    } catch (error) {
      console.error("Verify OTP Error:", error);

      if (error.response) {
        const responseData = error.response.data;

        // Laravel 422 or 400 validation errors
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
          responseData?.message || "رمز التحقق غير صحيح أو منتهي الصلاحية.";
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

  const handleResendOtp = async () => {
    if (!userEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني أولاً");
      return;
    }
    try {
      setIsResending(true);
      const res = await forgotPassword({ email: userEmail });
      toast.success(res.message || "تم إعادة إرسال رمز التحقق بنجاح");
    } catch (err) {
      toast.error(err.response?.data?.message || "تعذر إعادة إرسال الرمز");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-flow-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="auth-flow-card">
        <div className="auth-flow-header">
          <div className="auth-flow-icon">📩</div>
          <h1 className="auth-flow-title">تأكيد رمز التحقق</h1>
          <p className="auth-flow-subtitle">
            أدخل رمز التحقق (OTP) المكون من 6 أرقام والذي تم إرساله إلى:
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
          {/* البريد الإلكتروني (مخفي إذا متوفر أو معروض كحقل إذا لم يتوفر من الخطوة السابقة) */}
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
          )}

          {/* رمز التحقق OTP */}
          <div className="form-group">
            <label className="form-label" htmlFor="otp">
              رمز التحقق (6 أرقام) <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="otp"
                type="text"
                maxLength={6}
                inputMode="numeric"
                className={`form-input otp-input ${errors.otp ? "input-error" : ""}`}
                placeholder="------"
                disabled={isSubmitting}
                {...register("otp", {
                  required: "رمز التحقق مطلوب",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "رمز التحقق يجب أن يتكون من 6 أرقام فقط",
                  },
                })}
                onInput={(e) => {
                  // Allow numbers only
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />
            </div>
            {errors.otp && (
              <span className="error-message">{errors.otp.message}</span>
            )}
          </div>

          {/* زر التأكيد */}
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>جاري تأكيد الرمز...</span>
              </>
            ) : (
              <span>تأكيد الرمز</span>
            )}
          </button>
        </form>

        <div className="auth-flow-footer">
          <span>لم يصلك الرمز؟</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || isSubmitting}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontWeight: "600",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isResending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
          </button>
        </div>

        <div className="auth-flow-footer">
          <Link to="/forgot-password" className="auth-flow-link">
            تغيير البريد الإلكتروني
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
