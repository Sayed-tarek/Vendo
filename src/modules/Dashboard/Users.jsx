import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiUser,
  FiShield,
  FiEye,
  FiAlertCircle,
  FiLoader,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { getUsers, showUser, updateUserStatus } from "@/services/userService";
import "./Categories.css";
import "./Users.css";

export function DashboardUsers() {
  const { t, isRTL } = useTranslation();
  const { user: currentAdminUser } = useAuth();
  const isAdmin = currentAdminUser?.role === "admin";

  // Users list & server-side pagination state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0,
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Status update state & confirmation modal
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null); // { user, targetStatus: boolean }
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // User Details Modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Helper: Format initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper: Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr.split("T")[0] || dateStr;
    }
  };

  // Fetch users on mount, page change, or manual refresh
  useEffect(() => {
    let ignore = false;
    const loadUsers = async () => {
      try {
        setFetchError("");
        const response = await getUsers(currentPage);
        if (!ignore && response && response.data) {
          setUsers(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch users error:", err);
          setFetchError(
            t("errorLoadingUsers") || "تعذر تحميل المستخدمين، يرجى المحاولة مرة أخرى."
          );
        }
      } finally {
        if (!ignore) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      ignore = true;
    };
  }, [currentPage, refreshTrigger, t]);

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.last_page &&
      newPage !== currentPage &&
      !loadingUsers
    ) {
      setLoadingUsers(true);
      setCurrentPage(newPage);
    }
  };

  const handleRefreshUsers = () => {
    setLoadingUsers(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // ====================================================
  // VIEW USER DETAILS MODAL
  // ====================================================
  const handleOpenDetails = async (id) => {
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    setSelectedUser(null);

    try {
      const response = await showUser(id);
      const userData = response?.data?.data || response?.data;
      setSelectedUser(userData);
    } catch (err) {
      console.error("Error fetching user details:", err);
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "تعذر تحميل بيانات المستخدم" : "Failed to load user details")
      );
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedUser(null);
  };

  // ====================================================
  // UPDATE USER STATUS HANDLER
  // ====================================================
  // Keyboard accessibility: close status confirmation modal on Escape
  useEffect(() => {
    if (!statusConfirmTarget) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isTogglingStatus) {
        setStatusConfirmTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statusConfirmTarget, isTogglingStatus]);

  // When admin clicks status switch: prompt confirmation for either activating or deactivating
  const handleToggleStatusClick = (targetUser) => {
    if (updatingUserId === targetUser.id || !isAdmin) return;
    const targetStatus = !targetUser.status;
    setStatusConfirmTarget({ user: targetUser, targetStatus });
  };

  // Execute API status update: POST /dashboard/update/users/{id}/status with { status: boolean }
  const executeStatusToggle = async (targetUser, newStatus) => {
    if (!isAdmin) {
      toast.error(
        isRTL
          ? "ليس لديك صلاحية لتعديل حالة المستخدم."
          : "You do not have permission to update user status."
      );
      return;
    }

    setUpdatingUserId(targetUser.id);
    setIsTogglingStatus(true);

    try {
      await updateUserStatus(targetUser.id, newStatus);

      // Local update without full reload
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );

      // If user details modal is open for this user, keep in sync
      setSelectedUser((prev) =>
        prev && prev.id === targetUser.id ? { ...prev, status: newStatus } : prev
      );

      const successMsg = newStatus
        ? t("userActivatedSuccess") ||
          (isRTL
            ? "تم تفعيل المستخدم والسماح له بتسجيل الدخول."
            : "User activated successfully. Login access has been enabled.")
        : t("userDeactivatedSuccess") ||
          (isRTL
            ? "تم تعطيل المستخدم ومنعه من تسجيل الدخول."
            : "User deactivated successfully. Login access has been disabled.");

      toast.success(successMsg);

      // Close modal
      setStatusConfirmTarget(null);
    } catch (err) {
      console.error("Update status error:", err);
      const errMsg =
        err.response?.data?.message ||
        (isRTL ? "تعذر تحديث حالة المستخدم" : "Failed to update user status");
      toast.error(errMsg);
      // FAILURE: keep previous status in UI
    } finally {
      setUpdatingUserId(null);
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmStatusChange = () => {
    if (!statusConfirmTarget || isTogglingStatus) return;
    executeStatusToggle(statusConfirmTarget.user, statusConfirmTarget.targetStatus);
  };

  const handleCloseStatusModal = () => {
    if (isTogglingStatus) return;
    setStatusConfirmTarget(null);
  };

  return (
    <div className="users-container" aria-label="Users Management Page">
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      {/* Top Header Card */}
      <div className="users-top-header">
        <div className="users-header-info">
          <h1>{t("usersTitle")}</h1>
          <p>{t("usersSubtitle")}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn-retry-fetch"
            style={{ margin: 0 }}
            onClick={handleRefreshUsers}
            title={t("retry")}
            disabled={loadingUsers}
          >
            <FiRefreshCw className={loadingUsers ? "spin-animation" : ""} />
            <span>{t("retry")}</span>
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="users-list-card">
        <div className="list-card-header">
          <h2 className="list-card-title">{t("usersTitle")}</h2>
          <span style={{ fontSize: "0.86rem", color: "var(--vendo-gray-muted)" }}>
            {`${t("totalUsersCount")}: ${pagination.total}`}
          </span>
        </div>

        {/* 1. Loading State */}
        {loadingUsers && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-blue">
              <FiLoader className="spin-animation" />
            </div>
            <h3 className="state-title">{t("loadingUsers")}</h3>
          </div>
        )}

        {/* 2. Error State */}
        {!loadingUsers && fetchError && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-red">
              <FiAlertCircle />
            </div>
            <h3 className="state-title">{fetchError}</h3>
            <button
              type="button"
              className="btn-retry-fetch"
              onClick={handleRefreshUsers}
            >
              <FiRefreshCw />
              <span>{t("retry")}</span>
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!loadingUsers && !fetchError && users.length === 0 && (
          <div className="table-state-box">
            <div className="state-icon-box state-icon-gray">
              <FiUsers />
            </div>
            <h3 className="state-title">{t("noUsers")}</h3>
            <p className="state-desc">{t("noUsersDesc")}</p>
          </div>
        )}

        {/* 4. Users Table */}
        {!loadingUsers && !fetchError && users.length > 0 && (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th style={{ width: "65px" }}>{t("usersTableColId")}</th>
                    <th>{t("usersTableColUser")}</th>
                    <th>{t("usersTableColEmail")}</th>
                    <th>{t("usersTableColPhone")}</th>
                    <th>{t("usersTableColRole")}</th>
                    <th>{t("usersTableColStatus")}</th>
                    <th>{t("usersTableColCreatedAt")}</th>
                    <th style={{ textAlign: "center", width: "100px" }}>
                      {t("usersTableColActions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: "var(--vendo-gray-muted)" }}>
                        #{item.id}
                      </td>

                      {/* User (Avatar + Name) */}
                      <td>
                        <div className="user-cell-wrap">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="user-avatar-img"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className="user-avatar-placeholder"
                            style={{ display: item.image ? "none" : "flex" }}
                            title={item.name}
                          >
                            {getInitials(item.name)}
                          </div>

                          <div className="user-cell-meta">
                            <span className="user-cell-name">{item.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span style={{ fontSize: "0.88rem", color: "var(--vendo-dark)" }}>
                          {item.email}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        <span
                          dir="ltr"
                          style={{
                            fontSize: "0.88rem",
                            color: item.phone ? "var(--vendo-dark)" : "var(--vendo-gray-subtle)",
                          }}
                        >
                          {item.phone || "-"}
                        </span>
                      </td>

                      {/* Role */}
                      <td>
                        {item.role === "admin" ? (
                          <span className="badge-role-admin">
                            <FiShield size={12} />
                            <span>{t("userRoleAdmin")}</span>
                          </span>
                        ) : (
                          <span className="badge-role-user">
                            <FiUser size={12} />
                            <span>{t("userRoleUser")}</span>
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Switch */}
                      <td>
                        <button
                          type="button"
                          className={`status-toggle-btn ${
                            item.status ? "status-toggle-active" : "status-toggle-inactive"
                          }`}
                          onClick={() => handleToggleStatusClick(item)}
                          disabled={updatingUserId === item.id || !isAdmin}
                          title={
                            item.status
                              ? t("deactivateUser") || (isRTL ? "تعطيل المستخدم" : "Deactivate User")
                              : t("activateUser") || (isRTL ? "تفعيل المستخدم" : "Activate User")
                          }
                          aria-label={`${t("usersTableColStatus") || "الحالة"}: ${
                            item.status
                              ? t("userStatusActive") || (isRTL ? "نشط" : "Active")
                              : t("userStatusInactive") || (isRTL ? "غير نشط" : "Inactive")
                          }`}
                        >
                          {updatingUserId === item.id ? (
                            <FiLoader className="spin-animation" size={12} />
                          ) : (
                            <span
                              className={`status-indicator-dot ${
                                item.status ? "dot-green" : "dot-red"
                              }`}
                            />
                          )}
                          <span>
                            {item.status
                              ? t("userStatusActive") || (isRTL ? "نشط" : "Active")
                              : t("userStatusInactive") || (isRTL ? "غير نشط" : "Inactive")}
                          </span>
                          <span
                            className={`status-badge-switch ${
                              item.status ? "switch-on" : "switch-off"
                            }`}
                          >
                            {item.status ? "ON" : "OFF"}
                          </span>
                        </button>
                      </td>

                      {/* Created At */}
                      <td style={{ fontSize: "0.85rem", color: "var(--vendo-gray-muted)" }}>
                        {formatDate(item.created_at)}
                      </td>

                      {/* Actions: View Details */}
                      <td style={{ textAlign: "center" }}>
                        <div className="category-actions-group">
                          <button
                            type="button"
                            className="btn-cat-action btn-action-view"
                            title={t("viewUserDetails")}
                            onClick={() => handleOpenDetails(item.id)}
                            aria-label={`${t("viewUserDetails")} ${item.name}`}
                          >
                            <FiEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Controls */}
            {pagination.last_page > 1 && (
              <div className="pagination-bar" aria-label="Pagination Navigation">
                <div className="pagination-info">
                  {`${t("paginationPage")} ${currentPage} ${t("paginationOf")} ${
                    pagination.last_page
                  } (${t("totalUsersCount")}: ${pagination.total})`}
                </div>

                <div className="pagination-controls">
                  {/* Previous Button */}
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPage <= 1 || loadingUsers}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label={t("paginationPrev")}
                  >
                    {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
                    <span>{t("paginationPrev")}</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`btn-page-number ${
                          pageNum === currentPage ? "active" : ""
                        }`}
                        disabled={loadingUsers}
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={pageNum === currentPage ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  {/* Next Button */}
                  <button
                    type="button"
                    className="btn-page-step"
                    disabled={currentPage >= pagination.last_page || loadingUsers}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label={t("paginationNext")}
                  >
                    <span>{t("paginationNext")}</span>
                    {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================================================
          USER DETAILS MODAL
          ==================================================== */}
      {isDetailsModalOpen && (
        <div
          className="vendo-modal-backdrop"
          onClick={handleCloseDetails}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="user-details-modal-title" className="vendo-modal-title">
                <div className="modal-header-icon modal-icon-blue">
                  <FiUser />
                </div>
                <span>{t("userDetailsModalTitle")}</span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseDetails}
                aria-label={t("close")}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vendo-modal-body">
              {loadingDetails ? (
                <div className="table-state-box" style={{ padding: "3rem 1.5rem" }}>
                  <div className="state-icon-box state-icon-blue">
                    <FiLoader className="spin-animation" />
                  </div>
                  <h4 className="state-title">{t("loading")}</h4>
                </div>
              ) : selectedUser ? (
                <div>
                  {/* User Profile Summary Card */}
                  <div className="user-details-header-card">
                    {selectedUser.image ? (
                      <img
                        src={selectedUser.image}
                        alt={selectedUser.name}
                        className="user-details-avatar-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className="user-details-avatar-placeholder-lg"
                      style={{ display: selectedUser.image ? "none" : "flex" }}
                    >
                      {getInitials(selectedUser.name)}
                    </div>

                    <div className="user-details-title-info">
                      <h4 className="user-details-title-name">{selectedUser.name}</h4>
                      <span className="user-details-title-email">{selectedUser.email}</span>
                      <div>
                        {selectedUser.role === "admin" ? (
                          <span className="badge-role-admin">
                            <FiShield size={12} />
                            <span>{t("userRoleAdmin")}</span>
                          </span>
                        ) : (
                          <span className="badge-role-user">
                            <FiUser size={12} />
                            <span>{t("userRoleUser")}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="user-details-info-grid">
                    <div className="user-info-item">
                      <span className="user-info-label">{t("userDetailsId")}</span>
                      <span className="user-info-val">#{selectedUser.id}</span>
                    </div>

                    <div className="user-info-item">
                      <span className="user-info-label">{t("userDetailsStatus")}</span>
                      <div>
                        {selectedUser.status ? (
                          <span className="dash-badge-status dash-badge-active">
                            {t("userStatusActive")}
                          </span>
                        ) : (
                          <span className="dash-badge-status dash-badge-inactive">
                            {t("userStatusInactive")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="user-info-item">
                      <span className="user-info-label">{t("userDetailsPhone")}</span>
                      <span className="user-info-val" dir="ltr">
                        {selectedUser.phone || "-"}
                      </span>
                    </div>

                    <div className="user-info-item">
                      <span className="user-info-label">{t("userDetailsEmail")}</span>
                      <span className="user-info-val">{selectedUser.email}</span>
                    </div>

                    <div className="user-info-item">
                      <span className="user-info-label">{t("userDetailsCreatedAt")}</span>
                      <span className="user-info-val">
                        {formatDate(selectedUser.created_at)}
                      </span>
                    </div>

                    {selectedUser.updated_at && (
                      <div className="user-info-item">
                        <span className="user-info-label">{t("userDetailsUpdatedAt")}</span>
                        <span className="user-info-val">
                          {formatDate(selectedUser.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="table-state-box">
                  <h4 className="state-title">{t("noUsers")}</h4>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleCloseDetails}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          CONFIRM STATUS CHANGE MODAL (ACTIVATE / DEACTIVATE)
          ==================================================== */}
      {statusConfirmTarget && (
        <div
          className="vendo-modal-backdrop"
          onClick={handleCloseStatusModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-change-modal-title"
        >
          <div
            className="vendo-modal-card modal-size-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="vendo-modal-header">
              <h3 id="status-change-modal-title" className="vendo-modal-title">
                <div
                  className={`modal-header-icon ${
                    statusConfirmTarget.targetStatus ? "modal-icon-blue" : "modal-icon-red"
                  }`}
                >
                  {statusConfirmTarget.targetStatus ? <FiCheck /> : <FiAlertCircle />}
                </div>
                <span>
                  {statusConfirmTarget.targetStatus
                    ? t("confirmActivateUserTitle") ||
                      (isRTL ? "تأكيد تفعيل المستخدم" : "Confirm User Activation")
                    : t("confirmDeactivateUserTitle") ||
                      (isRTL ? "تأكيد تعطيل المستخدم" : "Confirm User Deactivation")}
                </span>
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseStatusModal}
                disabled={isTogglingStatus}
                aria-label={t("close") || (isRTL ? "إغلاق" : "Close")}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="vendo-modal-body">
              <div className="delete-confirm-body">
                <div
                  className={`delete-confirm-icon ${
                    statusConfirmTarget.targetStatus
                      ? "status-icon-activate"
                      : "status-icon-deactivate"
                  }`}
                >
                  {statusConfirmTarget.targetStatus ? <FiCheck /> : <FiAlertCircle />}
                </div>
                <h4 className="delete-confirm-title">
                  {statusConfirmTarget.targetStatus
                    ? t("activateUser") || (isRTL ? "تفعيل المستخدم" : "Activate User")
                    : t("deactivateUser") || (isRTL ? "تعطيل المستخدم" : "Deactivate User")}
                </h4>
                <p className="delete-confirm-text">
                  {statusConfirmTarget.targetStatus
                    ? t("confirmActivateUserMessage") ||
                      (isRTL
                        ? "هل تريد تفعيل هذا المستخدم والسماح له بتسجيل الدخول؟"
                        : "Do you want to activate this user and allow them to log in?")
                    : t("confirmDeactivateUserMessage") ||
                      (isRTL
                        ? "هل أنت متأكد من تعطيل هذا المستخدم؟ سيتم منعه من تسجيل الدخول حتى يتم تفعيله مرة أخرى."
                        : "Are you sure you want to deactivate this user? The user will not be able to log in until the account is activated again.")}
                </p>
                <div className="delete-target-badge">
                  <span>{statusConfirmTarget.user.name}</span>
                  <span style={{ margin: "0 0.35rem", opacity: 0.5 }}>-</span>
                  <span>{statusConfirmTarget.user.email}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="vendo-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleCloseStatusModal}
                disabled={isTogglingStatus}
              >
                {t("btnCancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="button"
                className={
                  statusConfirmTarget.targetStatus
                    ? "btn-modal-activate"
                    : "btn-modal-delete"
                }
                onClick={handleConfirmStatusChange}
                disabled={isTogglingStatus}
              >
                {isTogglingStatus ? (
                  <>
                    <FiLoader className="spin-animation" />
                    <span>
                      {statusConfirmTarget.targetStatus
                        ? t("activating") || (isRTL ? "جاري التفعيل..." : "Activating...")
                        : t("deactivating") || (isRTL ? "جاري التعطيل..." : "Deactivating...")}
                    </span>
                  </>
                ) : (
                  <>
                    {statusConfirmTarget.targetStatus ? <FiCheck /> : <FiAlertCircle />}
                    <span>
                      {statusConfirmTarget.targetStatus
                        ? t("btnActivate") || (isRTL ? "تفعيل" : "Activate")
                        : t("btnDeactivate") || (isRTL ? "تعطيل" : "Deactivate")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardUsers;
