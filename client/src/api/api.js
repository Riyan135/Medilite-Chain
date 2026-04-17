import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isPublicPath = (pathname) =>
  pathname === '/' ||
  pathname.startsWith('/sign-in') ||
  pathname.startsWith('/sign-up');

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    const pathname = window.location.pathname;
    const requestUrl = error.config?.url || '';

    if (error.response?.status === 401) {
      // Let the auth context decide how to handle session restore failures.
      if (requestUrl.includes('/auth/me')) {
        return Promise.reject(error);
      }

      if (!isPublicPath(pathname) && !pathname.includes('/emergency')) {
        toast.error('Session expired. Please sign in again.');
        window.location.href = '/sign-in';
      }
    } else {
      console.error('API Error:', message);
    }

    return Promise.reject(error);
  }
);

export default api;
