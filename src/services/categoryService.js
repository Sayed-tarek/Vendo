import api from "./api";

/**
 * Fetch all categories with pagination
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<any>}
 */
export const getCategories = async (page = 1) => {
  const response = await api.get(`/dashboard/all/categories?page=${page}`);
  return response.data;
};

/**
 * Create a new category with multipart/form-data
 * @param {FormData} formData - Contains name_ar, name_en, and image file
 * @returns {Promise<any>}
 */
export const createCategory = async (formData) => {
  const response = await api.post("/dashboard/create/categories", formData);
  return response.data;
};

/**
 * Fetch a single category by ID
 * @param {number|string} id - Category ID
 * @returns {Promise<any>}
 */
export const showCategory = async (id) => {
  const response = await api.get(`/dashboard/show/categories/${id}`);
  return response.data;
};

/**
 * Update an existing category
 * @param {number|string} id - Category ID
 * @param {FormData} formData - Contains name_ar, name_en, and optional new image file
 * @returns {Promise<any>}
 */
export const updateCategory = async (id, formData) => {
  const response = await api.post(`/dashboard/update/categories/${id}`, formData);
  return response.data;
};

/**
 * Delete a category by ID
 * @param {number|string} id - Category ID
 * @returns {Promise<any>}
 */
export const deleteCategory = async (id) => {
  const response = await api.delete(`/dashboard/delete/categories/${id}`);
  return response.data;
};

/**
 * Fetch all active categories across all pagination pages
 * Iterates through GET /dashboard/all/categories?page={page}
 * Filters active categories
 * @returns {Promise<Array>}
 */
export const getAllActiveCategories = async () => {
  let allCategories = [];
  let page = 1;
  let lastPage;

  do {
    const res = await getCategories(page);
    const data = res?.data || [];
    const active = data.filter((cat) => cat.status === undefined || cat.status === true || cat.status === 1 || cat.status === "1");
    allCategories = [...allCategories, ...active];
    lastPage = res?.pagination?.last_page || 1;
    page += 1;
  } while (page <= lastPage);

  return allCategories;
};

export default {
  getCategories,
  createCategory,
  showCategory,
  updateCategory,
  deleteCategory,
  getAllActiveCategories,
};

