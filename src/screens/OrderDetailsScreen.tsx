import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Order, CartItem } from '../types';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export function OrderDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id || !auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Verify ownership (or admin status, but for now just ownership)
          if (data.userId !== auth.currentUser.uid) {
            // Check if admin
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
              navigate('/orders');
              return;
            }
          }

          let parsedItems = [];
          try {
            parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
          } catch (e) {
            console.error('Failed to parse order items', e);
          }

          setOrder({
            id: docSnap.id,
            ...data,
            items: parsedItems
          } as Order);
        } else {
          navigate('/orders');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `orders/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-stone-300 mb-6" />
        <h2 className="text-3xl font-headline text-primary mb-4">Order Not Found</h2>
        <p className="text-on-surface-variant mb-8">The order you are looking for does not exist or you do not have permission to view it.</p>
        <Link to="/orders" className="bg-secondary text-on-secondary px-8 py-4 rounded-xl font-semibold inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  const subtotal = order.total / 1.08; // Reverse calculate subtotal
  const tax = order.total - subtotal;

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 md:py-16">
      <div className="mb-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 font-label uppercase tracking-widest text-xs font-bold">
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-2 block">Order Details</span>
            <h1 className="text-4xl md:text-5xl font-headline text-primary leading-tight">Order #{order.id.slice(-6).toUpperCase()}</h1>
            <p className="font-headline italic text-on-surface-variant mt-2 text-lg">{order.date}</p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label uppercase tracking-widest text-xs font-bold ${
            order.status === 'completed' ? 'bg-secondary/10 text-secondary' : 
            order.status === 'pending' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'
          }`}>
            {order.status === 'completed' ? <CheckCircle2 size={16} /> : 
             order.status === 'pending' ? <Clock size={16} /> : <XCircle size={16} />}
            {order.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <h2 className="font-headline text-2xl text-primary italic border-b border-stone-200 pb-4">Items</h2>
          <div className="space-y-8">
            {order.items.map((item, idx) => (
              <motion.div 
                key={item.cartId || idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container-high flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-headline text-lg text-primary">{item.quantity}x {item.name}</h3>
                    <span className="font-headline font-bold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">
                    {getOptionNames(item) || 'Standard Preparation'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-surface-container-low rounded-3xl p-8 sticky top-32 border border-outline-variant/30 shadow-sm">
            <h2 className="font-headline text-2xl text-primary mb-8 italic">Summary</h2>
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
                <span className="font-label text-sm uppercase tracking-wider font-bold text-primary">Total Paid</span>
                <span className="font-headline text-3xl font-bold text-secondary">${order.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="pt-8 border-t border-outline-variant/30">
              <h3 className="font-label text-xs uppercase tracking-[0.2em] text-stone-400 font-bold mb-4">Order Information</h3>
              <div className="space-y-3 text-sm font-body text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Order ID</span>
                  <span className="font-mono text-xs">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date Placed</span>
                  <span>{new Date(order.createdAt || '').toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
