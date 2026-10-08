import api from "./api";

/**
 * Attribute Service
 * Manages product colors and sizes in the Admin Dashboard.
 */

// ====================================================
// COLORS API
// ====================================================

/**
 * Fetch all colors with server-side pagination
 * Endpoint: GET /dashboard/all/colors?page={page}
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getColors = async (page = 1) => {
  const response = await api.get(`/dashboard/all/colors?page=${page}`);
  return response.data;
};

/**
 * Create a new color
 * Endpoint: POST /dashboard/create/colors
 * @param {{ name_ar: string, name_en: string }} data
 * @returns {Promise<{ success: boolean, message: string, data?: object }>}
 */
export const createColor = async (data) => {
  const response = await api.post("/dashboard/create/colors", data);
  return response.data;
};

/**
 * Delete a color by ID
 * Endpoint: DELETE /dashboard/delete/colors/{id}
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteColor = async (id) => {
  const response = await api.delete(`/dashboard/delete/colors/${id}`);
  return response.data;
};

// ====================================================
// SIZES API
// ====================================================

/**
 * Fetch all sizes with server-side pagination
 * Endpoint: GET /dashboard/all/sizes?page={page}
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<{ success: boolean, message: string, data: Array, pagination: object }>}
 */
export const getSizes = async (page = 1) => {
  const response = await api.get(`/dashboard/all/sizes?page=${page}`);
  return response.data;
};

/**
 * Create a new size
 * Endpoint: POST /dashboard/create/sizes
 * @param {{ name: string }} data
 * @returns {Promise<{ success: boolean, message: string, data?: object }>}
 */
export const createSize = async (data) => {
  const response = await api.post("/dashboard/create/sizes", data);
  return response.data;
};

/**
 * Delete a size by ID
 * Endpoint: DELETE /dashboard/delete/sizes/{id}
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteSize = async (id) => {
  const response = await api.delete(`/dashboard/delete/sizes/${id}`);
  return response.data;
};

/**
 * Fetch all active colors across all pagination pages
 * Iterates through GET /dashboard/all/colors?page={page}
 * Filters only options where status === true
 * @returns {Promise<Array>}
 */
export const getAllActiveColors = async () => {
  let allColors = [];
  let page = 1;
  let lastPage;

  do {
    const res = await getColors(page);
    const data = res?.data || [];
    const active = data.filter((item) => item.status === true || item.status === 1 || item.status === "1");
    allColors = [...allColors, ...active];
    lastPage = res?.pagination?.last_page || 1;
    page += 1;
  } while (page <= lastPage);

  return allColors;
};

/**
 * Fetch all active sizes across all pagination pages
 * Iterates through GET /dashboard/all/sizes?page={page}
 * Filters only options where status === true
 * @returns {Promise<Array>}
 */
export const getAllActiveSizes = async () => {
  let allSizes = [];
  let page = 1;
  let lastPage;

  do {
    const res = await getSizes(page);
    const data = res?.data || [];
    const active = data.filter((item) => item.status === true || item.status === 1 || item.status === "1");
    allSizes = [...allSizes, ...active];
    lastPage = res?.pagination?.last_page || 1;
    page += 1;
  } while (page <= lastPage);

  return allSizes;
};

export default {
  getColors,
  createColor,
  deleteColor,
  getSizes,
  createSize,
  deleteSize,
  getAllActiveColors,
  getAllActiveSizes,
};
