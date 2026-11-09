import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const FitnessContext = createContext(null);

export const FitnessProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(api.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!api.getToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('myfitsync_theme') || 'dark');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Apply theme class to root html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('myfitsync_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const logout = useCallback(() => {
    api.clearToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setDashboardData(null);
  }, []);

  // Hook into ApiClient for automatic 401 logout
  useEffect(() => {
    api.setLogoutCallback(logout);
  }, [logout]);

  // Load user profile on startup if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = api.getToken();
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to restore session:", err);
          logout();
        }
      }
      setIsLoadingAuth(false);
    };
    initAuth();
  }, [logout]);

  const login = async (credentials, persistMode = 'local') => {
    const res = await api.login(credentials, persistMode);
    setToken(res.access_token);
    const profile = await api.getMe();
    setUser(profile);
    setIsAuthenticated(true);
    return profile;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    return res;
  };

  const updateProfile = async (profileData) => {
    const updated = await api.updateMe(profileData);
    setUser(updated);
    return updated;
  };

  const refreshDashboard = useCallback(async (fromDate, toDate) => {
    if (!api.getToken()) return;
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const data = await api.getDashboard(fromDate, toDate);
      setDashboardData(data);
    } catch (err) {
      setDashboardError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  return (
    <FitnessContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoadingAuth,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        updateProfile,
        dashboardData,
        loadingDashboard,
        dashboardError,
        refreshDashboard,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};
