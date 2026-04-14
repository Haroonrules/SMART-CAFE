import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      if (requireAdmin) {
        try {
          // Get the current ID token result to check for custom claims
          const tokenResult = await user.getIdTokenResult();
          
          // Extract BOTH admin and kitchen claims
          const isAdmin = !!tokenResult.claims.admin;
          const isKitchen = !!tokenResult.claims.kitchen;
          
          console.log('[PROTECTED-ROUTE] User claims:', { isAdmin, isKitchen, email: user.email });
          console.log('[PROTECTED-ROUTE] Current path:', location.pathname);
          
          // Path-based RBAC logic
          if (isAdmin) {
            // Admin can access EVERYTHING
            console.log('[PROTECTED-ROUTE] Admin access granted');
            setIsAuthorized(true);
          } else if (isKitchen) {
            // Kitchen staff can ONLY access /admin/orders
            const allowedPaths = ['/admin/orders', '/admin'];
            const isAllowedPath = allowedPaths.some(path => 
              location.pathname === path || location.pathname.startsWith(path + '/')
            );
            
            if (isAllowedPath) {
              console.log('[PROTECTED-ROUTE] Kitchen staff access granted to:', location.pathname);
              setIsAuthorized(true);
            } else {
              console.log('[PROTECTED-ROUTE] Kitchen staff blocked from:', location.pathname);
              setIsAuthorized(false);
            }
          } else {
            // No admin or kitchen claim - not authorized
            console.log('[PROTECTED-ROUTE] No valid claims found');
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('Error checking claims:', error);
          setIsAuthorized(false);
        }
      } else {
        // Non-admin protected route just requires authentication
        setIsAuthorized(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requireAdmin, location.pathname]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!isAuthorized) {
    // Redirect to profile page (or could create a dedicated "Not Authorized" page)
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}