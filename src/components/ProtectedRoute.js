import React from 'react';
import { useAtom } from 'jotai';
import { Navigate } from 'react-router-dom';
import { authAtom } from '../atoms/authAtom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated] = useAtom(authAtom);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
