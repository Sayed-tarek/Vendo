import api from "./api";

/**
 * Fetch all storefront products
 * Endpoint: GET /home/products
 * @returns {Promise<{ success: boolean, message: string, data: Array }>}
 */
export const getProducts = async () => {
  const response = await api.get("/home/products");
  return response.data;
};

/**
 * Fetch storefront categories for filtering
 * Endpoint: GET /home/categories
 * @returns {Promise<{ success: boolean, message: string, data: Array }>}
 */
export const getHomeCategories = async () => {
  const response = await api.get("/home/categories");
  return response.data;
};

/**
 * Fetch storefront promotional offers
 * Endpoint: GET /home/offers
 * @returns {Promise<{ success: boolean, message: string, data: Array }>}
 */
export const getOffers = async () => {
  const response = await api.get("/home/offers");
  return response.data;
};

/**
 * Fetch single product details by ID
 * Endpoint: GET /home/show/products/{id}
 * @param {number|string} id - Product ID
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export const getProductDetails = async (id) => {
  const response = await api.get(`/home/show/products/${id}`);
  return response.data;
};

/**
 * Create a new product in the Admin Dashboard (Normal or Variant mode)
 * Endpoint: POST /dashboard/create/products
 * @param {FormData} formData
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export const createProduct = async (formData) => {
  const response = await api.post("/dashboard/create/products", formData);
  return response.data;
};

/**
 * Fetch all dashboard products with server-side pagination
 * Endpoint: GET /dashboard/all/products?page={page}
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getDashboardProducts = async (page = 1) => {
  const response = await api.get(`/dashboard/all/products?page=${page}`);
  return response.data;
};

/**
 * Fetch dashboard products that have offers with server-side pagination
 * Endpoint: GET /dashboard/products/offers?page={page}
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getDashboardOffers = async (page = 1) => {
  const response = await api.get(`/dashboard/products/offers?page=${page}`);
  return response.data;
};

/**
 * Update an existing product in the Admin Dashboard (Normal or Variant mode)
 * Endpoint: POST /dashboard/update/products/{id}
 * @param {number|string} id - Product ID
 * @param {FormData} formData - Multipart form data
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export const updateProduct = async (id, formData) => {
  const response = await api.post(`/dashboard/update/products/${id}`, formData);
  return response.data;
};

export const updateDashboardProduct = updateProduct;

/**
 * Delete a product by ID in the Admin Dashboard
 * Endpoint: DELETE /dashboard/delete/products/{id}
 * @param {number|string} id - Product ID
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteProduct = async (id) => {
  const response = await api.delete(`/dashboard/delete/products/${id}`);
  return response.data;
};

export const deleteDashboardProduct = deleteProduct;

export { createProductReview } from "./reviewService";

export default {
  getProducts,
  getHomeCategories,
  getOffers,
  getProductDetails,
  createProduct,
  getDashboardProducts,
  getDashboardOffers,
  updateProduct,
  updateDashboardProduct,
  deleteProduct,
  deleteDashboardProduct,
};

