import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const syncSession = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    clearSession();
    return { valid: false };
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data?.success && res.data.user) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { valid: true, user: res.data.user };
    }

    clearSession();
    return { valid: false };
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearSession();
    }
    return { valid: false };
  }
};

export const setupSessionInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearSession();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};
