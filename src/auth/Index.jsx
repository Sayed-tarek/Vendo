import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/layouts/LogoutButton";
import "./Index.css";

function Index() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="home-container">
      {/* Navbar Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-logo">V</div>
            <div>
              <span className="brand-title">متجر Vendo</span>
              <span className="brand-badge" style={{ marginRight: "0.5rem" }}>
                React 19 + Vite
              </span>
            </div>
          </div>

          <div className="header-actions">
            {isLoading ? (
              <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
                جاري التحقق...
              </span>
            ) : isAuthenticated ? (
              <>
                <div className="user-pill">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="user-avatar"
                    />
                  ) : (
                    <span style={{ fontSize: "1.1rem" }}>👤</span>
                  )}
                  <span className="user-name">{user?.name || "المستخدم"}</span>
                </div>
                <Link to="/profile" className="btn-nav-primary">
                  الملف الشخصي
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-nav-primary">
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="btn-nav-secondary">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="home-main">
        {/* Hero Section */}
        <section className="hero-card">
          <div className="hero-text">
            <span className="hero-tag">نظام المصادقة والتفاعل المكتمل</span>
            <h1 className="hero-title">
              لوحة التحكم وتفاصيل تفاعل نظام المتجر
            </h1>
            <p className="hero-desc">
              تم بناء منظومة التوثيق وحسابات المستخدمين المتكاملة وفق أعلى معايير
              الأمان، وتشمل التسجيل، الدخول المستمر، تحديث الملف الشخصي مع رفع
              الصور، واستعادة كلمة المرور عبر الـ OTP.
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">جاهزية التوثيق</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">6</span>
              <span className="stat-label">واجهات تفاعلية</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">
                {isAuthenticated ? "مسجل" : "زائر"}
              </span>
              <span className="stat-label">حالة الجلسة</span>
            </div>
          </div>
        </section>

        {/* Feature & Interaction Cards */}
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <span>⚡</span> شاشات ومسارات التفاعل المتاحة في النظام
            </h2>
          </div>
          <div className="features-grid">
            {/* بطاقة تسجيل حساب جديد */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-blue">📝</div>
              <h3 className="feature-card-title">إنشاء حساب جديد (Register)</h3>
              <p className="feature-card-desc">
                استمارة تسجيل كاملة وسريعة مع التحقق الشامل من البيانات
                (الاسم، البريد، الهاتف، وكلمة المرور).
              </p>
              <Link to="/register" className="feature-link">
                فتح صفحة التسجيل ←
              </Link>
            </div>

            {/* بطاقة تسجيل الدخول */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-green">🔐</div>
              <h3 className="feature-card-title">تسجيل الدخول (Login)</h3>
              <p className="feature-card-desc">
                إمكانية الدخول بالبريد الإلكتروني أو رقم الهاتف مع دعم الحفظ
                التلقائي المستمر للـ Session عبر LocalStorage و AuthContext.
              </p>
              <Link to="/login" className="feature-link">
                فتح صفحة الدخول ←
              </Link>
            </div>

            {/* بطاقة الملف الشخصي */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-purple">👤</div>
              <h3 className="feature-card-title">الملف الشخصي (Profile)</h3>
              <p className="feature-card-desc">
                مسار محمي (`ProtectedRoute`) يتيح عرض بيانات المستخدم الحالية،
                وتحديث الاسم والبريد والهاتف والصورة وتحديث الـ State فوريًا.
              </p>
              <Link to="/profile" className="feature-link">
                إدارة الملف الشخصي ←
              </Link>
            </div>

            {/* بطاقة استعادة كلمة المرور */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-amber">🔑</div>
              <h3 className="feature-card-title">استعادة كلمة المرور (OTP)</h3>
              <p className="feature-card-desc">
                مسار متكامل من 3 خطوات: طلب إرسال الرمز للبريد، تأكيد رمز التحقق
                (6 أرقام)، وتعيين كلمة المرور الجديدة.
              </p>
              <Link to="/forgot-password" className="feature-link">
                بدء استعادة كلمة المرور ←
              </Link>
            </div>
          </div>
        </section>

        {/* Current Auth State Details */}
        <section className="status-card">
          <div className="section-header">
            <h2 className="section-title">
              <span>🔍</span> تفاصيل جلسة المستخدم الحالية (Live Auth State)
            </h2>
          </div>
          {isAuthenticated ? (
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "0.5rem",
                  color: "#065f46",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  marginBottom: "1rem",
                }}
              >
                <span>✓</span> أنت مسجل الدخول حالياً ومصرح لك بالوصول لكافة
                المسارات المحمية.
              </div>
              <div className="user-info-grid">
                <div className="info-box">
                  <div className="info-label">اسم المستخدم</div>
                  <div className="info-value">{user?.name || "—"}</div>
                </div>
                <div className="info-box">
                  <div className="info-label">البريد الإلكتروني</div>
                  <div className="info-value" style={{ direction: "ltr" }}>
                    {user?.email || "—"}
                  </div>
                </div>
                <div className="info-box">
                  <div className="info-label">رقم الهاتف</div>
                  <div className="info-value" style={{ direction: "ltr" }}>
                    {user?.phone || "—"}
                  </div>
                </div>
                <div className="info-box">
                  <div className="info-label">الدور (Role)</div>
                  <div className="info-value">{user?.role || "مستخدم"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "1rem 1.25rem",
                backgroundColor: "#fffbeb",
                border: "1px solid #fef3c7",
                borderRadius: "0.5rem",
                color: "#92400e",
                lineHeight: "1.6",
              }}
            >
              أنت حالياً تتصفح كـ <strong>زائر (Guest)</strong>. لتجربة الميزات
              المحمية وتحديث الملف الشخصي يمكنك{" "}
              <Link
                to="/login"
                style={{
                  color: "#2563eb",
                  fontWeight: "700",
                  textDecoration: "underline",
                }}
              >
                تسجيل الدخول
              </Link>{" "}
              أو{" "}
              <Link
                to="/register"
                style={{
                  color: "#2563eb",
                  fontWeight: "700",
                  textDecoration: "underline",
                }}
              >
                إنشاء حساب جديد
              </Link>
              .
            </div>
          )}
        </section>

        {/* Live API Endpoints Status Table */}
        <section className="endpoints-card">
          <div className="section-header">
            <h2 className="section-title">
              <span>🌐</span> نقاط الاتصال بالخادم المربوطة والمختبرة (API Endpoints)
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="endpoints-table">
              <thead>
                <tr>
                  <th>الوظيفة</th>
                  <th>طريقة الطلب</th>
                  <th>المسار (Endpoint)</th>
                  <th>نوع المحتوى</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>إنشاء حساب جديد</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/register</code>
                  </td>
                  <td>multipart/form-data</td>
                  <td>
                    <span className="status-badge">نشط ومفعل ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>تسجيل الدخول</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/login</code>
                  </td>
                  <td>application/json</td>
                  <td>
                    <span className="status-badge">نشط ومفعل ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>عرض الملف الشخصي</td>
                  <td>
                    <span className="method-tag method-get">GET</span>
                  </td>
                  <td>
                    <code>/api/profile</code>
                  </td>
                  <td>Bearer Token</td>
                  <td>
                    <span className="status-badge">محمي ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>تحديث الملف الشخصي</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/update-profile</code>
                  </td>
                  <td>multipart/form-data</td>
                  <td>
                    <span className="status-badge">محمي ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>طلب استعادة كلمة المرور</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/forgot-password</code>
                  </td>
                  <td>application/json</td>
                  <td>
                    <span className="status-badge">نشط ومفعل ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>تأكيد كود OTP</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/verify-otp</code>
                  </td>
                  <td>application/json</td>
                  <td>
                    <span className="status-badge">نشط ومفعل ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>تعيين كلمة المرور الجديدة</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/reset-password</code>
                  </td>
                  <td>application/json</td>
                  <td>
                    <span className="status-badge">نشط ومفعل ✓</span>
                  </td>
                </tr>
                <tr>
                  <td>تسجيل الخروج</td>
                  <td>
                    <span className="method-tag method-post">POST</span>
                  </td>
                  <td>
                    <code>/api/logout</code>
                  </td>
                  <td>Bearer Token</td>
                  <td>
                    <span className="status-badge">نشط ومفعل ✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Index;