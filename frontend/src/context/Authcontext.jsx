import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // Set API client default header
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      const fetchedUser = response.data.user;
      // make sure both id and _id are available so components can use either
      if (fetchedUser) {
        if (fetchedUser.id && !fetchedUser._id) fetchedUser._id = fetchedUser.id;
        if (fetchedUser._id && !fetchedUser.id) fetchedUser.id = fetchedUser._id;
      }
      setUser(fetchedUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      let { token, user } = response.data;
      // ensure both id and _id are defined so components can use either field
      if (user._id && !user.id) user.id = user._id;
      if (user.id && !user._id) user._id = user.id;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      toast.success('Login successful!');
      return { success: true, role: user.role };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);

      localStorage.setItem('token', res.data.token);

      return {
        success: true,
        role: res.data.user.role
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    token,
    sidebarOpen,
    toggleSidebar,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};