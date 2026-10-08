import api from "./api";

/**
 * Fetch all users with server-side pagination
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<any>}
 */
export const getUsers = async (page = 1) => {
  const response = await api.get(`/dashboard/all/users?page=${page}`);
  return response.data;
};

/**
 * Fetch a single user's detailed information by ID
 * @param {number|string} id - User ID
 * @returns {Promise<any>}
 */
export const showUser = async (id) => {
  const response = await api.get(`/dashboard/show/users/${id}`);
  return response.data;
};

/**
 * Update user status
 * Endpoint confirmed via backend Allow/OPTIONS check: POST /dashboard/update/users/{id}/status
 * @param {number|string} id - User ID
 * @param {boolean} status - New status (true = active, false = inactive)
 * @returns {Promise<any>}
 */
export const updateUserStatus = async (id, status) => {
  const response = await api.post(`/dashboard/update/users/${id}/status`, {
    status,
  });
  return response.data;
};
