import api from "./api";

/**
 * Order Service
 * Handles order creation, dashboard orders listing, and order details using the existing Axios instance.
 */

/**
 * Create a new order
 * Endpoint: POST /orders
 * Payload:
 * {
 *   items: [{ product_id, product_variant_id?, quantity }],
 *   governorate: string,
 *   address: string,
 *   delivery_phone: string,
 *   note?: string,
 *   shipping: number
 * }
 * @param {object} orderPayload
 * @returns {Promise<any>}
 */
export const createOrder = async (orderPayload) => {
  const response = await api.post("/orders", orderPayload);
  return response.data;
};

/**
 * Fetch all dashboard orders with server-side pagination
 * Endpoint: GET /dashboard/all/orders?page={page}
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getDashboardOrders = async (page = 1) => {
  const response = await api.get(`/dashboard/all/orders?page=${page}`);
  return response.data;
};

/**
 * Fetch a single order's details by ID for the admin dashboard
 * Endpoint: GET /dashboard/show/orders/{id}
 * @param {number|string} id - Order ID
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export const getDashboardOrderById = async (id) => {
  const response = await api.get(`/dashboard/show/orders/${id}`);
  return response.data;
};

/**
 * Allowed order statuses matching backend rule:
 * Rule::in(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
 */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * Update order status for admin dashboard
 * Endpoint: POST /dashboard/update/orders/{id}/status
 * Payload: { "status": "processing" }
 * @param {number|string} id - Order ID
 * @param {string} status - New order status ('pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled')
 * @returns {Promise<any>}
 */
export const updateDashboardOrderStatus = async (id, status) => {
  const response = await api.post(`/dashboard/update/orders/${id}/status`, { status });
  return response.data;
};

/**
 * Fetch authenticated customer's orders with server-side pagination
 * Endpoint: GET /my/orders?page={page}
 * Uses Bearer token from sessionStorage via api interceptor. Never send user_id.
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getMyOrders = async (page = 1) => {
  const response = await api.get(`/my/orders?page=${page}`);
  return response.data;
};

export default {
  createOrder,
  getDashboardOrders,
  getDashboardOrderById,
  updateDashboardOrderStatus,
  getMyOrders,
  ORDER_STATUSES,
};
