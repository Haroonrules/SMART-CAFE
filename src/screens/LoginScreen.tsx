import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export function LoginScreen() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-primary/20 backdrop-blur-[4px]">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="w-full max-w-lg bg-surface-container-lowest rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-12 shadow-[0px_24px_48px_rgba(38,23,12,0.12)] border-t border-white/20"
      >
        <div className="md:hidden w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8"></div>
        
        <div className="text-center mb-10">
          <h2 className="font-headline text-3xl text-primary mb-3">Customer Login</h2>
          <p className="text-on-surface-variant text-sm font-label tracking-wide uppercase">Welcome to the table</p>
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => navigate('/otp')}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="font-medium text-primary">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            <span className="text-on-surface-variant font-label text-[10px] tracking-widest uppercase">or phone number</span>
            <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <label className="block text-[10px] font-label font-bold tracking-[0.05rem] uppercase text-on-surface-variant mb-2">Mobile Number</label>
              <div className="relative flex items-center border-b border-outline-variant group-focus-within:border-secondary transition-colors duration-500 py-2">
                <span className="text-primary font-medium pr-3 border-r border-outline-variant/30">+1</span>
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-primary placeholder-on-surface-variant/40 py-2 px-4 text-lg tracking-widest font-body" 
                  placeholder="000 000 0000" 
                  type="tel"
                />
              </div>
            </div>
            <button 
              onClick={() => navigate('/otp')}
              className="w-full hearth-gradient text-on-secondary py-5 px-6 rounded-xl font-bold text-lg shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
            >
              Continue
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-on-surface-variant/60 leading-relaxed px-4">
          By continuing, you agree to our <a className="underline underline-offset-4 decoration-secondary-fixed-dim/40 text-primary" href="#">Terms of Service</a> and <a className="underline underline-offset-4 decoration-secondary-fixed-dim/40 text-primary" href="#">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
