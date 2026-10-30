import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lovekaro_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lovekaro_token') || null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' | 'signup'

  // Load user profile on initial mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('lovekaro_token');
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          if (res?.data) {
            setUser(res.data);
            try {
              localStorage.setItem('lovekaro_user', JSON.stringify(res.data));
            } catch (_) {}
          }
        } catch (err) {
          console.warn('Session check note:', err.message);
          // Only clear session if token is genuinely invalid (401/403). Never clear if backend is offline (503/network)
          if (err.status === 401 || err.status === 403) {
            localStorage.removeItem('lovekaro_token');
            localStorage.removeItem('lovekaro_user');
            setUser(null);
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const openLogin = () => {
    setModalMode('login');
    setIsModalOpen(true);
  };

  const openSignup = () => {
    setModalMode('signup');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAuthSuccess = (userData) => {
    if (userData && userData.token) {
      localStorage.setItem('lovekaro_token', userData.token);
      try {
        localStorage.setItem('lovekaro_user', JSON.stringify(userData));
      } catch (_) {}
      setToken(userData.token);
      setUser(userData);
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const nextUser = prev ? { ...prev, ...updatedFields } : updatedFields;
      try {
        localStorage.setItem('lovekaro_user', JSON.stringify(nextUser));
      } catch (_) {}
      return nextUser;
    });
  };

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    handleAuthSuccess(res.data);
    window.location.hash = 'profile';
    return res.data;
  };

  const loginWithOtp = async (phone, otp) => {
    const res = await authApi.loginWithOtp(phone, otp);
    handleAuthSuccess(res.data);
    window.location.hash = 'profile';
    return res.data;
  };

  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    handleAuthSuccess(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('lovekaro_token');
    localStorage.removeItem('lovekaro_user');
    setToken(null);
    setUser(null);
    window.location.hash = 'home';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        isModalOpen,
        modalMode,
        setModalMode,
        openLogin,
        openSignup,
        closeModal,
        login,
        loginWithOtp,
        signup,
        updateUser,
        logout,
      }}
    >
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
