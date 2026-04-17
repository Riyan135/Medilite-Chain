import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();
const DOCTOR_STORAGE_KEY = 'medilite_doctor_token';
const LEGACY_STORAGE_KEY = 'medilite_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedDoctorToken = localStorage.getItem(DOCTOR_STORAGE_KEY);
      const legacyUser = localStorage.getItem(LEGACY_STORAGE_KEY);

      if (!storedDoctorToken && legacyUser) {
        try {
          const parsedLegacyUser = JSON.parse(legacyUser);
          if (parsedLegacyUser?.role === 'DOCTOR' && parsedLegacyUser?.token) {
            localStorage.setItem(DOCTOR_STORAGE_KEY, parsedLegacyUser.token);
          }
        } catch (error) {
          console.error('Failed to restore doctor token from legacy storage:', error);
        }
      }

      localStorage.removeItem(LEGACY_STORAGE_KEY);

      const token = localStorage.getItem(DOCTOR_STORAGE_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.user?.role === 'DOCTOR') {
          setUser({ ...response.data.user, token });
        } else {
          localStorage.removeItem(DOCTOR_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to restore doctor session:', error);
        localStorage.removeItem(DOCTOR_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(DOCTOR_STORAGE_KEY, userData.token);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(DOCTOR_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  const register = (userData) => {
    setUser(userData);
    localStorage.setItem(DOCTOR_STORAGE_KEY, userData.token);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
