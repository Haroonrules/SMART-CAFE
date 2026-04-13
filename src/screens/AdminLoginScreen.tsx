import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export function AdminLoginScreen() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-container-low px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl p-10 md:p-12 shadow-[0px_32px_64px_rgba(38,23,12,0.08)] border border-stone-200/20"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <Lock size={28} />
          </div>
          <h1 className="text-3xl font-headline text-primary mb-2">Kitchen Admin</h1>
          <p className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]">Restricted Access</p>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); navigate('/admin/orders'); }}
          className="space-y-8"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">Email Address</label>
              <div className="relative">
                <input 
                  className="w-full bg-stone-50 border-b border-stone-200 py-4 pl-12 pr-4 font-body text-primary outline-none focus:border-primary transition-colors" 
                  type="email" 
                  placeholder="admin@smartcafe.com"
                  defaultValue="chef@smartcafe.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">Password</label>
              <div className="relative">
                <input 
                  className="w-full bg-stone-50 border-b border-stone-200 py-4 pl-12 pr-4 font-body text-primary outline-none focus:border-primary transition-colors" 
                  type="password" 
                  placeholder="••••••••"
                  defaultValue="password123"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              </div>
            </div>
          </div>

          <button className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
            Unlock Portal
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-12 text-center">
          <button className="text-stone-400 text-xs hover:text-primary transition-colors">Forgot credentials?</button>
        </div>
      </motion.div>
    </main>
  );
}
