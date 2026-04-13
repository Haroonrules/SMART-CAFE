import React, { useState } from 'react';
import { useCart } from '../CartContext';
import { Trash2, Minus, Plus, ShoppingBag, CreditCard, Wallet, Loader2, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';

export function CartScreen() {
  const { items, removeItem, updateQuantity, subtotal, getItemPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const getOptionNames = (item: CartItem) => {
    if (!item.selectedOptions || !item.customizations) return null;
    
    const names: string[] = [];
    Object.entries(item.selectedOptions).forEach(([groupId, optionIds]) => {
      const group = item.customizations?.find(g => g.id === groupId);
      if (!group) return;

      const ids = Array.isArray(optionIds) ? optionIds : [optionIds];
      ids.forEach(id => {
        const option = group.options.find(o => o.id === id);
        if (option) names.push(option.name);
      });
    });
    
    return names.length > 0 ? names.join(' • ') : null;
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Sign in error', error);
      toast.error('Failed to sign in');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order.');
      return;
    }

    setIsPlacingOrder(true);
    
    // Simulate payment processing
    toast.loading('Processing payment...', { id: 'payment' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Payment successful!', { id: 'payment' });
    
    try {
      const orderData = {
        userId: user.uid,
        items: JSON.stringify(items),
        total: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          totalOrders: increment(1),
          loyaltyPoints: increment(Math.floor(total))
        });
      } catch (userError) {
        console.error("Failed to update user profile stats", userError);
      }
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-stone-300 mb-6" />
        <h2 className="text-3xl font-headline text-primary mb-4">Your cart is empty</h2>
        <p className="text-on-surface-variant mb-8">Add some curated selections to your ritual.</p>
        <Link to="/" className="bg-secondary text-on-secondary px-8 py-4 rounded-xl font-semibold inline-block">
          Explore Menu
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 md:py-16">
      <div className="mb-12">
        <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-2 block">Your Selection</span>
        <h1 className="text-5xl md:text-6xl font-headline text-primary leading-tight">Review Order</h1>
        <p className="font-headline italic text-on-surface-variant mt-4 text-lg">"A curated selection for your morning ritual."</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
          {items.map(item => (
            <div key={item.cartId} className="flex gap-6 items-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-high flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow">
                <h3 className="font-headline text-xl text-primary">{item.name}</h3>
                <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">
                  {getOptionNames(item) || 'Standard Preparation'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center bg-surface-container-low rounded-full px-3 py-1 gap-4">
                    <button 
                      onClick={() => updateQuantity(item.cartId, -1)}
                      className="text-secondary hover:scale-110 transition-transform"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-label font-bold text-primary">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartId, 1)}
                      className="text-secondary hover:scale-110 transition-transform"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-headline font-bold text-primary">
                    ${(getItemPrice(item, item.selectedOptions) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => removeItem(item.cartId)}
                className="text-outline-variant hover:text-error transition-colors p-2"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-surface-container-low rounded-2xl p-8 sticky top-32">
            <h2 className="font-headline text-2xl text-primary mb-8 italic">Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="font-label text-sm uppercase tracking-wider text-on-surface-variant">Subtotal</span>
                <span className="font-headline text-lg text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-label text-sm uppercase tracking-wider text-on-surface-variant">Estimated Tax</span>
                <span className="font-headline text-lg text-primary">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="font-label text-sm uppercase tracking-wider font-bold text-primary">Final Total</span>
                <span className="font-headline text-3xl font-bold text-secondary">${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-4">
              {user ? (
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full bg-secondary text-on-secondary font-label uppercase tracking-[0.2em] font-bold py-5 rounded-2xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? <Loader2 className="animate-spin" size={20} /> : 'Place Order'}
                </button>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="w-full bg-primary text-white font-label uppercase tracking-[0.2em] font-bold py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogIn size={20} />
                  Sign In to Order
                </button>
              )}
              <p className="text-center font-label text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">
                Free delivery for loyalty members
              </p>
            </div>
            <div className="mt-12 flex justify-center gap-4 opacity-30 grayscale">
              <CreditCard size={24} />
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
