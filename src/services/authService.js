import api from "./api";

/**
 * Check whether a user account is active
 * status === true or 1 or "1" -> Active
 * status === false or 0 or "0" -> Inactive
 * @param {object} user
 * @returns {boolean}
 */
export const isUserActive = (user) => {
  if (!user) return false;
  return !(
    user.status === false ||
    user.status === 0 ||
    user.status === "0" ||
    user.status === "inactive"
  );
};

/**
 * Register a new user
 * Endpoint: POST /register
 * Payload contains ONLY: name, email, phone, password, password_confirmation
 * (Profile image upload has been removed from registration)
 * @param {FormData|{ name: string, email: string, phone: string, password: string, password_confirmation: string }} data
 * @returns {Promise<any>}
 */
export const registerUser = async (data) => {
  let payload = data;
  if (!(data instanceof FormData)) {
    payload = new FormData();
    if (data.name) payload.append("name", data.name);
    if (data.email) payload.append("email", data.email);
    if (data.phone) payload.append("phone", data.phone);
    if (data.password) payload.append("password", data.password);
    if (data.password_confirmation) payload.append("password_confirmation", data.password_confirmation);
  }
  const response = await api.post("/register", payload);
  return response.data;
};

/**
 * Login user with login (email or phone) and password
 * @param {{ login: string, password: string }} credentials
 * @returns {Promise<any>}
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};

/**
 * Logout user
 * @returns {Promise<any>}
 */
export const logoutUser = async () => {
  const response = await api.post("/logout");
  return response.data;
};

/**
 * Get current authenticated user profile
 * @returns {Promise<any>}
 */
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

/**
 * Update authenticated user profile with FormData
 * @param {FormData} formData
 * @returns {Promise<any>}
 */
export const updateProfile = async (formData) => {
  const response = await api.post("/update-profile", formData);
  return response.data;
};

/**
 * Send OTP to user email for password reset
 * @param {{ email: string }} data
 * @returns {Promise<any>}
 */
export const forgotPassword = async (data) => {
  const response = await api.post("/forgot-password", data);
  return response.data;
};

/**
 * Verify OTP sent to email
 * @param {{ email: string, otp: string }} data
 * @returns {Promise<any>}
 */
export const verifyOtp = async (data) => {
  const response = await api.post("/verify-otp", data);
  return response.data;
};

/**
 * Reset password with verified OTP
 * @param {{ email: string, otp: string, password: string, password_confirmation: string }} data
 * @returns {Promise<any>}
 */
export const resetPassword = async (data) => {
  const response = await api.post("/reset-password", data);
  return response.data;
};


