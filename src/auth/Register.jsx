import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { registerUser } from "@/services/authService";
import "./Register.css";

function Register() {
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setServerError("");

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("password", data.password);
    formData.append("password_confirmation", data.password_confirmation);

    try {
      const responseData = await registerUser(formData);
      console.log("Register Response:", responseData);
      toast.success("تم إنشاء الحساب بنجاح");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Register Error:", error);

      if (error.response) {
        // Laravel validation errors (HTTP 422)
        const responseData = error.response.data;
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
          "حدث خطأ أثناء التسجيل، يرجى مراجعة البيانات المدخلة.";
        setServerError(message);
        toast.error(message);
      } else if (error.request) {
        // Network error (no response received)
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
    <div className="register-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">إنشاء حساب جديد</h1>
          <p className="register-subtitle">أدخل بياناتك للتسجيل في المتجر</p>
        </div>

        {serverError && (
          <div className="general-alert" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="register-form" noValidate>
          {/* الاسم */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              الاسم <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="name"
                type="text"
                className={`form-input ${errors.name ? "input-error" : ""}`}
                placeholder="أدخل اسمك الكامل"
                disabled={isSubmitting}
                {...register("name", {
                  required: "الاسم مطلوب",
                })}
              />
            </div>
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>

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

          {/* رقم الهاتف */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              رقم الهاتف <span className="required-mark">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="phone"
                type="tel"
                className={`form-input ${errors.phone ? "input-error" : ""}`}
                placeholder="01xxxxxxxxx"
                disabled={isSubmitting}
                {...register("phone", {
                  required: "رقم الهاتف مطلوب",
                })}
              />
            </div>
            {errors.phone && (
              <span className="error-message">{errors.phone.message}</span>
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

          {/* زر التسجيل */}
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>جاري إنشاء الحساب...</span>
              </>
            ) : (
              <span>إنشاء الحساب</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          لديك حساب بالفعل؟
          <Link to="/login" className="login-link">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
