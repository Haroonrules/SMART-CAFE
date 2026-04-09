import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MenuScreen } from './screens/MenuScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AdminOrdersScreen } from './screens/AdminOrdersScreen';
import { AdminInventoryScreen } from './screens/AdminInventoryScreen';
import { AdminStaffScreen } from './screens/AdminStaffScreen';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
import { CartScreen } from './screens/CartScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { OrderDetailsScreen } from './screens/OrderDetailsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { WineListScreen } from './screens/WineListScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OTPScreen } from './screens/OTPScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { ConfirmationScreen } from './screens/ConfirmationScreen';
import { CartProvider } from './CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar, MobileNav } from './components/Navigation';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';

function App() {
  return (
    <ErrorBoundary>
      <ApiKeyGuard>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-surface-container-lowest flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingScreen />} />
                  <Route path="/login" element={<LoginScreen />} />
                  <Route path="/otp" element={<OTPScreen />} />
                  <Route path="/admin/login" element={<AdminLoginScreen />} />
                  
                  {/* Customer Routes */}
                  <Route path="/menu" element={<MenuScreen />} />
                  <Route path="/wine" element={<WineListScreen />} />
                  <Route path="/cart" element={<CartScreen />} />
                  <Route path="/checkout" element={<CheckoutScreen />} />
                  <Route path="/confirmation" element={<ConfirmationScreen />} />
                  <Route path="/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsScreen /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProfileScreen />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboardScreen /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrdersScreen /></ProtectedRoute>} />
                  <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminInventoryScreen /></ProtectedRoute>} />
                  <Route path="/admin/staff" element={<ProtectedRoute requireAdmin><AdminStaffScreen /></ProtectedRoute>} />
                  
                  {/* Catch All */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <MobileNav />
              <Toaster position="top-right" richColors theme="light" />
            </div>
          </BrowserRouter>
        </CartProvider>
      </ApiKeyGuard>
    </ErrorBoundary>
  );
}

export default App;
