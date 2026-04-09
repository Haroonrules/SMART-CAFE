import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Search, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Order } from '../types';
import { toast } from 'sonner';

export function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    
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
      
      // Sort by creation date descending
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

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (o.userId && o.userId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
      toast.error('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="lg:ml-64 flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <main className="lg:ml-64 p-6 lg:p-10 bg-surface-container-lowest min-h-screen pt-24 lg:pt-10">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div>
          <span className="text-[0.75rem] font-label tracking-[0.2em] text-stone-400 uppercase mb-2 block">Live Operations</span>
          <h1 className="text-4xl lg:text-5xl font-headline text-primary">Live Orders</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-6 w-full md:w-80 font-body text-sm outline-none focus:border-primary transition-colors" 
              placeholder="Search orders, users..." 
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          </div>
        </div>
      </header>

      <div className="flex gap-4 lg:gap-8 mb-10 border-b border-stone-100 pb-1 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {['all', 'pending', 'preparing', 'ready', 'completed'].map(s => (
          <button 
            key={s}
            onClick={() => setFilter(s)}
            className={`pb-4 text-xs lg:text-sm uppercase tracking-widest font-bold transition-all relative ${
              filter === s ? 'text-primary' : 'text-stone-400 hover:text-primary'
            }`}
          >
            {s}
            {filter === s && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map(order => (
            <motion.div 
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-stone-200/30 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-8 flex justify-between items-start border-b border-stone-50">
                <div className="flex gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    order.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-stone-50 text-stone-400'
                  }`}>
                    {order.status === 'pending' ? <Clock size={32} /> :
                     order.status === 'preparing' ? <Sparkles size={32} /> :
                     order.status === 'ready' ? <CheckCircle2 size={32} /> :
                     <CheckCircle2 size={32} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-headline text-primary">Order</h3>
                      <span className="text-[10px] font-label uppercase tracking-widest text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                        {order.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-body">
                      User: {order.userId?.slice(0, 8)}... • {new Date(order.createdAt || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-grow space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-xs font-bold text-primary">
                        {item.quantity}x
                      </span>
                      <span className="font-body text-primary">{item.name}</span>
                    </div>
                    <span className="font-headline italic text-stone-400">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-stone-50/50 border-t border-stone-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-headline italic text-primary">${order.total.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="bg-primary text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/10 hover:scale-[1.02] transition-transform"
                    >
                      Mark as Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-stone-800/10 hover:scale-[1.02] transition-transform"
                    >
                      Complete Order
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Served
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
