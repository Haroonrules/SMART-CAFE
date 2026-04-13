import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(requireAdmin);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsAuthorized(false);
      setCheckingAdmin(false);
      return;
    }

    if (requireAdmin) {
      const checkAdminStatus = async () => {
        try {
          const tokenResult = await user.getIdTokenResult();
          setIsAuthorized(tokenResult.claims.admin === true);
        } catch (error) {
          console.error('Error checking admin claims:', error);
          setIsAuthorized(false);
        } finally {
          setCheckingAdmin(false);
        }
      };
      checkAdminStatus();
    } else {
      setIsAuthorized(true);
      setCheckingAdmin(false);
    }
  }, [user, loading, requireAdmin]);

  // Show loading spinner while Firebase is restoring session or checking admin status
  if (loading || checkingAdmin) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}