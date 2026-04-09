import React, { useEffect } from 'react';
import { useCart } from '../CartContext';
import { Check, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function ConfirmationScreen() {
  const { clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-tertiary/30"
      >
        <Check className="text-white" size={48} />
      </motion.div>

      <div className="mb-12">
        <span className="font-label text-xs uppercase tracking-[0.3em] text-secondary font-bold mb-4 block">Success</span>
        <h1 className="text-5xl md:text-6xl font-headline text-primary mb-6">Order #42</h1>
        <p className="text-2xl font-headline italic text-on-surface-variant">"Kitchen has your order!"</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <div className="bg-surface-container-low p-8 rounded-2xl flex flex-col items-center">
          <Clock className="text-secondary mb-4" size={32} />
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Estimated Wait</span>
          <p className="font-headline text-2xl text-primary">8-12 minutes</p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-2xl flex flex-col items-center">
          <MapPin className="text-secondary mb-4" size={32} />
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Pickup Point</span>
          <p className="font-headline text-2xl text-primary">Table 04</p>
        </div>
      </div>

      <div className="bg-primary-container text-white p-8 rounded-2xl mb-12 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
        <div className="flex items-start gap-4 relative z-10">
          <Sparkles className="text-secondary-container shrink-0" size={24} />
          <div>
            <h3 className="font-headline text-xl mb-2">Concierge Note</h3>
            <p className="text-white/80 leading-relaxed italic">
              "We've informed the barista to use extra microfoam for your Velvet Latte, just the way you like it. Enjoy your ritual."
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-secondary text-on-secondary px-10 py-5 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all">
          Track Order
          <ArrowRight size={18} />
        </button>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-surface-container-highest text-primary px-10 py-5 rounded-xl font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </main>
  );
}
