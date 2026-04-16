import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const DOCTOR_STORAGE_KEY = 'medilite_doctor_user';
const LEGACY_STORAGE_KEY = 'medilite_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep existing doctor sessions working while moving this portal to its own storage key.
    const storedDoctorUser =
      localStorage.getItem(DOCTOR_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);

    if (storedDoctorUser) {
      try {
        const parsedUser = JSON.parse(storedDoctorUser);

        if (parsedUser?.role === 'DOCTOR') {
          setUser(parsedUser);
          localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(parsedUser));
        }
      } catch (error) {
        console.error('Failed to restore doctor session:', error);
      }
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(DOCTOR_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  const register = (userData) => {
    setUser(userData);
    localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(userData));
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
