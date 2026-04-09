import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingScreen() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-surface">
      {/* Ambient Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[80%] rounded-full bg-secondary-fixed-dim/20 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[60%] rounded-full bg-tertiary-fixed/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-headline italic tracking-tight text-primary">
            Smart Cafe
          </h1>
        </motion.div>

        <div className="relative w-full mb-16 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-secondary-container/10 blur-3xl rounded-xl -rotate-3 scale-110"></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 2 }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden rounded-xl editorial-shadow w-72 h-96 md:w-96 md:h-[32rem]"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIJlTQ3kwrgbMyHfor5ZreQWOMhKMCixTLn7JehtSm9OLQw8hC7YjIZvhQqCgciJ7cFzgzXCafzQGI8I28D3I5S8JCrFyIKtZ_8z3VEzNoNirzWSrUx1480GIGxB2pW-31kLGMCnOKVdhcyFoIK4Bt8puj8IYfOkqo__iwDZDisVUlQBQbOKwQ1FW62oNVddaSD99HTexpB3QCKZhX_D1L7h1i53RRbaVbJNNiheIRvVwBhl_iU9od4u1PUPwwHLJEdjQruWBH6zc" 
                alt="Steaming artisan espresso"
                className="w-full h-full object-cover grayscale-[20%] contrast-[110%]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -50, rotate: -10 }}
              animate={{ opacity: 1, x: 0, rotate: -6 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute -bottom-8 -left-12 md:-bottom-12 md:-left-20 w-32 h-32 md:w-48 md:h-48 rounded-xl editorial-shadow border-8 border-surface-container-lowest overflow-hidden"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB_F_ibortVATaE-9g4LimpUczABdyj0HJWKkmkZ1B2a_RkSK8QddriO8QF8hZ-pXvvOXeGpTnxJ_5xHLZrUHv3C2dCbp9INnmWrYpYTiTgamsQYfMSWlKVWBR5VEXYtbygZSSD0Ee8MXl2_5V94x_HXvPRXqSUIhQp15_uglsj6YQ0itAqCmm0TfFiGNeCXdpgRsNAvlxuRbSuuJKCryd_8URCQ9Y3PhpK5x8jU9fbNjFuF51Y27xnoTQQNeU0LJeZi48M6iPtlw" 
                alt="Freshly baked croissant"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center max-w-xl mb-12"
        >
          <p className="font-label text-xs uppercase tracking-[0.2rem] text-secondary mb-4">
            The Digital Maître D’
          </p>
          <h2 className="text-3xl md:text-4xl font-headline text-primary leading-tight mb-6">
            Welcome to Smart Cafe. Let our AI concierge guide your next meal.
          </h2>
          <div className="h-px w-12 bg-outline-variant/30 mx-auto"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          <Link to="/login" className="group relative bg-secondary text-on-secondary px-10 py-5 rounded-xl font-medium text-lg flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 active:scale-[0.98]">
            <QrCode size={24} />
            <span>Scan Table QR</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          </Link>
          <Link to="/menu" className="text-primary font-medium flex items-center gap-2 group">
            <span className="border-b border-secondary/40 group-hover:border-secondary transition-colors pb-0.5">Explore the menu first</span>
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>

      <div className="fixed bottom-8 px-6 w-full flex justify-center pointer-events-none">
        <div className="glass-concierge editorial-shadow px-6 py-4 rounded-xl flex items-center gap-4 max-w-sm pointer-events-auto border border-white/20">
          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center">
            <Sparkles className="text-tertiary-fixed" size={16} />
          </div>
          <div>
            <p className="text-[0.65rem] font-label uppercase tracking-widest text-on-surface-variant">Live Presence</p>
            <p className="text-xs text-on-surface font-medium">Your AI host is ready to assist</p>
          </div>
        </div>
      </div>
    </main>
  );
}
