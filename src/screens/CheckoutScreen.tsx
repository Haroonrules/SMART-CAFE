import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { CreditCard, Wallet, Apple, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

export function CheckoutScreen() {
  const { subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState('apple');
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleComplete = () => {
    // In a real app, process payment here
    navigate('/confirmation');
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 md:py-16">
      <div className="mb-12">
        <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-2 block">Final Step</span>
        <h1 className="text-5xl md:text-6xl font-headline text-primary leading-tight">Complete Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <section>
            <h2 className="font-headline text-2xl text-primary mb-6 italic">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PaymentOption 
                active={method === 'apple'} 
                onClick={() => setMethod('apple')}
                icon={<Apple size={24} />}
                label="Apple Pay"
              />
              <PaymentOption 
                active={method === 'google'} 
                onClick={() => setMethod('google')}
                icon={<Wallet size={24} />}
                label="Google Pay"
              />
              <PaymentOption 
                active={method === 'card'} 
                onClick={() => setMethod('card')}
                icon={<CreditCard size={24} />}
                label="Credit Card"
              />
              <PaymentOption 
                active={method === 'counter'} 
                onClick={() => setMethod('counter')}
                icon={<Building2 size={24} />}
                label="Pay at Counter"
              />
            </div>
          </section>

          {method === 'card' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 pt-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">Card Details</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-low border-b border-outline-variant py-4 px-4 font-body text-primary outline-none focus:border-secondary transition-colors" placeholder="0000 0000 0000 0000" />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">Expiry</label>
                  <input className="w-full bg-surface-container-low border-b border-outline-variant py-4 px-4 font-body text-primary outline-none focus:border-secondary transition-colors" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">CVV</label>
                  <input className="w-full bg-surface-container-low border-b border-outline-variant py-4 px-4 font-body text-primary outline-none focus:border-secondary transition-colors" placeholder="000" />
                </div>
              </div>
            </motion.div>
          )}

          <div className="pt-8">
            <div className="flex items-start gap-4 p-6 bg-tertiary-fixed/20 rounded-2xl border border-tertiary-fixed/30">
              <CheckCircle2 className="text-tertiary shrink-0" size={24} />
              <p className="text-sm text-on-tertiary-fixed-variant leading-relaxed">
                Your payment is secured with industry-standard encryption. We never store your full card details.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-surface-container-low rounded-2xl p-8 sticky top-32">
            <h2 className="font-headline text-2xl text-primary mb-8 italic">Order Total</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="font-label text-sm uppercase tracking-wider text-on-surface-variant">Subtotal</span>
                <span className="font-headline text-lg text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-label text-sm uppercase tracking-wider text-on-surface-variant">Tax</span>
                <span className="font-headline text-lg text-primary">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="font-label text-sm uppercase tracking-wider font-bold text-primary">Total Amount</span>
                <span className="font-headline text-3xl font-bold text-secondary">${total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={handleComplete}
              className="w-full bg-primary text-on-primary font-label uppercase tracking-[0.2em] font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Pay & Complete
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function PaymentOption({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
        active ? 'border-secondary bg-secondary/5 shadow-md' : 'border-outline-variant/30 hover:border-outline-variant'
      }`}
    >
      <div className={`${active ? 'text-secondary' : 'text-stone-400'}`}>
        {icon}
      </div>
      <span className={`font-medium ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
    </button>
  );
}
