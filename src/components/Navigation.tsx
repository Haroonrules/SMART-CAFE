import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink as RouterNavLink } from 'react-router-dom';
import { ShoppingBag, User, Bell, Table, Menu as MenuIcon, Receipt, Wine, Sparkles, LayoutDashboard, Package, Users, Menu, X, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function Navbar() {
  const location = useLocation();
  const [isAdminMobileMenuOpen, setIsAdminMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userRole, setUserRole] = useState<string>('admin'); // Default to admin
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          
          // Check custom claims - backend sets { kitchen: true } or { admin: true }
          const isAdmin = !!tokenResult.claims.admin;
          const isKitchen = !!tokenResult.claims.kitchen;
          
          // Determine role based on claims
          const role = isAdmin ? 'admin' : (isKitchen ? 'kitchen' : 'admin');
          setUserRole(role);
          
          console.log('[NAVIGATION] User claims:', { isAdmin, isKitchen, role });
        } catch (error) {
          console.error('Error getting user role:', error);
          setUserRole('admin');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAdmin) {
    return (
      <>
        {/* Mobile Admin Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200/15 flex items-center justify-between px-6 z-[60]">
          <Link to="/admin/orders" className="text-lg font-headline italic text-primary">Admin Portal</Link>
          <button 
            onClick={() => setIsAdminMobileMenuOpen(!isAdminMobileMenuOpen)}
            className="p-2 text-primary hover:bg-stone-50 rounded-xl transition-colors"
          >
            {isAdminMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Admin Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-white border-r border-stone-200/15 shadow-sm z-50 w-64 transition-transform duration-300 lg:translate-x-0",
          isAdminMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="mb-8 px-2 hidden lg:block">
            <h1 className="text-lg font-headline italic text-primary">Admin Portal</h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest">The Digital Maître D’</p>
          </div>
          <div className="lg:hidden h-16" /> {/* Spacer for mobile header */}
          <nav className="flex-1 space-y-1">
            {userRole === 'admin' && (
              <>
                <AdminNavLink to="/admin/orders" icon={<Receipt size={20} />} label="Live Orders" onClick={() => setIsAdminMobileMenuOpen(false)} />
                <AdminNavLink to="/admin/menu" icon={<Package size={20} />} label="Menu Management" onClick={() => setIsAdminMobileMenuOpen(false)} />
                <AdminNavLink to="/admin/wines" icon={<Wine size={20} />} label="Wine Cellar" onClick={() => setIsAdminMobileMenuOpen(false)} />
                <AdminNavLink to="/admin/staff" icon={<Users size={20} />} label="Staff Directory" onClick={() => setIsAdminMobileMenuOpen(false)} />
                <AdminNavLink to="/admin/insights" icon={<TrendingUp size={20} />} label="AI Analytics" onClick={() => setIsAdminMobileMenuOpen(false)} />
              </>
            )}
            {userRole === 'kitchen' && (
              <AdminNavLink to="/admin/orders" icon={<Receipt size={20} />} label="Live Orders" onClick={() => setIsAdminMobileMenuOpen(false)} />
            )}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isAdminMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsAdminMobileMenuOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto border-b border-stone-100">
      <div className="flex items-center gap-12">
        <Link to="/" className="text-2xl font-headline italic text-primary">Smart Cafe</Link>
        <div className="hidden md:flex gap-8">
          <HeaderNavLink to="/" label="Menu" />
          <HeaderNavLink to="/wine" label="Wine List" />
          <HeaderNavLink to="/orders" label="Orders" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center bg-surface-container rounded-full px-4 py-1.5">
          <Table className="text-secondary mr-2" size={14} />
          <span className="text-[0.75rem] font-label tracking-widest uppercase text-primary font-bold">Table 04</span>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-stone-100/50 transition-colors"
            >
              <Bell size={20} className="text-on-surface-variant" />
            </button>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 p-6 z-50">
                  <div className="flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center">
                      <Bell size={20} className="text-stone-300" />
                    </div>
                    <div>
                      <p className="font-headline text-primary font-bold">No Notifications</p>
                      <p className="text-xs text-stone-400 mt-1 font-body">You're all caught up!</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <RouterNavLink 
            to="/profile" 
            className={({ isActive }) => cn(
              "p-2 rounded-full transition-colors",
              isActive ? "bg-secondary/10 text-secondary" : "hover:bg-stone-100/50 text-on-surface-variant"
            )}
          >
            <User size={20} />
          </RouterNavLink>
        </div>
      </div>
    </nav>
  );
}

function HeaderNavLink({ to, label }: { to: string, label: string }) {
  return (
    <RouterNavLink 
      to={to} 
      className={({ isActive }) => cn(
        "text-[0.75rem] tracking-widest uppercase font-label transition-all pb-1 border-b-2",
        isActive ? "text-secondary border-secondary font-bold" : "text-primary/60 border-transparent hover:text-primary"
      )}
    >
      {label}
    </RouterNavLink>
  );
}

function AdminNavLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <RouterNavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
        isActive ? "bg-secondary/10 text-secondary font-semibold" : "text-stone-500 hover:text-primary hover:bg-stone-50"
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </RouterNavLink>
  );
}

export function MobileNav() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-200/20 px-6 py-4 flex justify-around items-center z-50 rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <MobileNavLink to="/" icon={<MenuIcon size={20} />} label="Menu" />
      <MobileNavLink to="/wine" icon={<Wine size={20} />} label="Wine" />
      <MobileNavLink to="/orders" icon={<Receipt size={20} />} label="Orders" />
      <MobileNavLink to="/cart" icon={<ShoppingBag size={20} />} label="Cart" />
      <MobileNavLink to="/profile" icon={<User size={20} />} label="Account" />
    </nav>
  );
}

function MobileNavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <RouterNavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex flex-col items-center gap-1 transition-colors",
        isActive ? "text-secondary" : "text-stone-400 hover:text-primary"
      )}
    >
      {icon}
      <span className="text-[0.6rem] font-label uppercase tracking-tighter">{label}</span>
    </RouterNavLink>
  );
}
