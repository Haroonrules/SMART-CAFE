import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { Order } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        let parsedItems = [];
        try {
          parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        } catch (e) {
          console.error('Failed to parse order items', e);
        }
        return {
          id: doc.id,
          ...data,
          items: parsedItems
        };
      }) as Order[];
      
      // Sort on client side to avoid composite index requirement
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
      <div className="mb-12">
        <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-2 block">History</span>
        <h1 className="text-5xl md:text-6xl font-headline text-primary leading-tight">Your Orders</h1>
        <p className="font-headline italic text-on-surface-variant mt-4 text-lg">"A journey through your curated rituals."</p>
      </div>

      <div className="space-y-8">
        {orders.map((order, idx) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  order.status === 'completed' ? 'bg-secondary/10 text-secondary' : 
                  order.status === 'pending' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'
                }`}>
                  {order.status === 'completed' ? <CheckCircle2 size={28} /> : 
                   order.status === 'pending' ? <Clock size={28} /> : <XCircle size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-headline text-primary mb-1">{order.id}</h3>
                  <p className="text-sm text-on-surface-variant font-label uppercase tracking-widest">{order.date}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-12">
                <div className="text-right">
                  <span className="text-[0.6rem] font-label text-stone-400 uppercase tracking-widest block mb-1">Total Amount</span>
                  <span className="text-2xl font-headline italic text-primary">${order.total.toFixed(2)}</span>
                </div>
                <Link to={`/orders/${order.id}`} className="p-3 bg-surface-container-high rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
            
            <div className="p-6 md:p-8 bg-stone-50/50">
              <div className="flex flex-wrap gap-4">
                {order.items.map(item => (
                  <div key={item.cartId} className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-2 shadow-sm">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-label uppercase tracking-widest font-bold text-primary">
                      {item.quantity}x {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBag size={64} className="mx-auto text-stone-300 mb-6" />
          <h2 className="text-3xl font-headline text-primary mb-4">No orders yet</h2>
          <p className="text-on-surface-variant mb-8">Start your first ritual today.</p>
          <Link to="/menu" className="bg-secondary text-on-secondary px-8 py-4 rounded-xl font-semibold">
            Explore Menu
          </Link>
        </div>
      )}
    </div>
  );
}
