import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import Loader from './loader';

const PrivateRoute = ({ role }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={`/${user?.role}/dashboard`} />;
  }

  return <Outlet />;
};

export default PrivateRoute;