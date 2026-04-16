import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token if needed
api.interceptors.request.use((config) => {
  const storedUser =
    localStorage.getItem('medilite_doctor_user') || localStorage.getItem('medilite_user');
  if (storedUser) {
    try {
      const { token } = JSON.parse(storedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    
    // Don't show toast for 401s if we're on the sign-in page, otherwise show it
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please sign in again.');
        localStorage.removeItem('medilite_doctor_user');
        localStorage.removeItem('medilite_user');
        window.location.href = '/login';
      }
    } else {
      // Don't show generic toast for specific pages that handle it locally, 
      // but usually it's fine.
      console.error('API Error:', message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
