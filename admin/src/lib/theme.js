export const ADMIN_THEME_STORAGE_KEY = 'medilite_admin_theme';

export const getStoredAdminTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return localStorage.getItem(ADMIN_THEME_STORAGE_KEY) || 'light';
};

export const applyAdminTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-admin-theme', theme);
};

export const persistAdminTheme = (theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  }

  applyAdminTheme(theme);
};
