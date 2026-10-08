import api from "./api";

/**
 * Review Service
 * Manages product reviews in the Vendo Admin Dashboard.
 * Reuses the centralized Axios instance with Bearer Token interceptor.
 */

/**
 * Fetch all product reviews with server-side pagination
 * Endpoint: GET /dashboard/all/reviews?page={page}
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getDashboardReviews = async (page = 1) => {
  const response = await api.get(`/dashboard/all/reviews?page=${page}`);
  return response.data;
};

/**
 * Fetch a single review's detailed information by ID
 * Endpoint: GET /dashboard/show/reviews/{id}
 * @param {number|string} id - Review ID
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export const getDashboardReviewById = async (id) => {
  const response = await api.get(`/dashboard/show/reviews/${id}`);
  return response.data;
};

/**
 * Update review status (enable/disable)
 * Endpoint: POST /dashboard/update/reviews/{id}/status
 * HTTP Method confirmed via server OPTIONS Allow header: POST
 * Body: { status: boolean }
 * @param {number|string} id - Review ID
 * @param {boolean} status - New status (true = active, false = inactive)
 * @returns {Promise<{ status: boolean }>}
 */
export const updateDashboardReviewStatus = async (id, status) => {
  const response = await api.post(`/dashboard/update/reviews/${id}/status`, {
    status,
  });
  return response.data;
};

/**
 * Create a customer product review for an authenticated user.
 * Endpoint: POST /products/{productId}/reviews
 * @param {number|string} productId - Dynamic Product ID
 * @param {{ rating: number, comment: string }} reviewData - Rating (1-5) and comment
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export const createProductReview = async (productId, reviewData) => {
  const payload = {
    rating: Number(reviewData.rating),
    comment: typeof reviewData.comment === "string" ? reviewData.comment.trim() : reviewData.comment,
  };

  const response = await api.post(`/products/${productId}/reviews`, payload);
  return response.data;
};

export default {
  getDashboardReviews,
  getDashboardReviewById,
  updateDashboardReviewStatus,
  createProductReview,
};
