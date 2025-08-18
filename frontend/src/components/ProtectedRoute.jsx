import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {React.ReactNode} children 
 * @param {string[]} [allowedRoles] 
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.tipo_usuario)) {
    console.warn(`Acesso negado para ${user?.email} à rota ${location.pathname}. Role necessária: ${allowedRoles.join(', ')}, Role do usuário: ${user?.tipo_usuario}`);
    return <Navigate to="/" replace />;
  }
  return children ? children : <Outlet />;
};

export default ProtectedRoute;