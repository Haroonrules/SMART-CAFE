import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, TrendingUp, Package, ArrowUpRight, ArrowDownRight, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: string;
  price: number;
  trend?: string;
}

export function AdminInventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Coffee',
    status: 'In Stock',
    price: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      // Try to fetch from Firestore inventory collection
      const snapshot = await getDocs(collection(db, 'inventory'));
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
        setInventory(items);
      } else {
        // If no inventory exists, show empty state with message
        setInventory([]);
        toast.info('No inventory items found. Add your first item!');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // For now, we'll use direct Firestore write since this is internal admin data
      // In production, this should also go through backend API
      const docRef = await addDoc(collection(db, 'inventory'), {
        name: newItem.name,
        category: newItem.category,
        status: newItem.status,
        price: parseFloat(newItem.price),
        trend: '0%',
        created_at: new Date().toISOString()
      });
      
      setInventory([{ id: docRef.id, name: newItem.name, category: newItem.category, status: newItem.status, price: parseFloat(newItem.price), trend: '0%' }, ...inventory]);
      setShowAddModal(false);
      setNewItem({ name: '', category: 'Coffee', status: 'In Stock', price: '' });
      toast.success('Inventory item added successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add inventory item');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'inventory', id), {
        status: newStatus
      });
      setInventory(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  return (
    <main className="lg:ml-64 p-6 lg:p-10 bg-surface-container-lowest min-h-screen pt-24 lg:pt-10">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div>
          <span className="text-[0.75rem] font-label tracking-[0.2em] text-stone-400 uppercase mb-2 block">Supply Chain</span>
          <h1 className="text-4xl lg:text-5xl font-headline text-primary">Inventory</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-6 w-full md:w-80 font-body text-sm outline-none focus:border-primary transition-colors" 
              placeholder="Search ingredients, suppliers..." 
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
          >
            <Plus size={20} />
            Add Stock
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <>
            <StatCard 
              icon={<Package className="text-blue-600" size={24} />}
              label="Total Items"
              value={inventory.length.toString()}
              trend="+4"
              trendType="up"
            />
            <StatCard 
              icon={<AlertTriangle className="text-amber-600" size={24} />}
              label="Low Stock Alerts"
              value={inventory.filter(i => i.status === 'Low Stock').length.toString()}
              trend="-2"
              trendType="down"
            />
            <StatCard 
              icon={<TrendingUp className="text-emerald-600" size={24} />}
              label="Monthly Spend"
              value="$4,250"
              trend="+12%"
              trendType="up"
            />
          </>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/30 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex gap-8">
            {['all', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`text-sm uppercase tracking-widest font-bold transition-all relative pb-1 ${
                  filter === s ? 'text-primary border-b-2 border-primary' : 'text-stone-400 hover:text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px] lg:min-w-0">
            <thead>
              <tr className="text-left border-b border-stone-100">
                <th className="px-8 py-5 font-label text-[10px] uppercase tracking-widest text-stone-400">Ingredient</th>
                <th className="px-8 py-5 font-label text-[10px] uppercase tracking-widest text-stone-400">Category</th>
                <th className="px-8 py-5 font-label text-[10px] uppercase tracking-widest text-stone-400">Status</th>
                <th className="px-8 py-5 font-label text-[10px] uppercase tracking-widest text-stone-400">Trend</th>
                <th className="px-8 py-5 text-right font-label text-[10px] uppercase tracking-widest text-stone-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-headline text-primary font-bold">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">{item.id}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-label uppercase tracking-widest text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{item.category}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${
                      item.status === 'In Stock' ? 'text-emerald-600' :
                      item.status === 'Low Stock' ? 'text-amber-600' : 'text-error'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center gap-1 text-xs font-bold ${
                      item.trend.startsWith('+') ? 'text-emerald-600' : 'text-error'
                    }`}>
                      {item.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {item.trend}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {['In Stock', 'Low Stock', 'Out of Stock'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(item.id, s)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                            item.status === s 
                            ? s === 'In Stock' ? 'bg-emerald-600 text-white' : s === 'Low Stock' ? 'bg-amber-500 text-white' : 'bg-error text-white'
                            : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-400" />
              </button>
              
              <h2 className="text-3xl font-headline text-primary mb-8 italic">Add New Stock Item</h2>
              
              <form onSubmit={handleAddStock} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Ingredient Name</label>
                  <input 
                    required
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    placeholder="e.g. Arabica Beans"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Category</label>
                    <select 
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                      className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    >
                      <option>Coffee</option>
                      <option>Dairy</option>
                      <option>Produce</option>
                      <option>Bakery</option>
                      <option>Tea</option>
                      <option>Pantry</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Initial Status</label>
                    <select 
                      value={newItem.status}
                      onChange={e => setNewItem({...newItem, status: e.target.value})}
                      className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                    >
                      <option>In Stock</option>
                      <option>Low Stock</option>
                      <option>Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Unit Price ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={e => setNewItem({...newItem, price: e.target.value})}
                      className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 font-body text-primary outline-none focus:border-primary transition-colors"
                      placeholder="15.00"
                    />
                  </div>
                </div>

                <button className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 hover:scale-[1.01] active:scale-95 transition-all">
                  Add to Inventory
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatCard({ icon, label, value, trend, trendType }: { icon: React.ReactNode, label: string, value: string, trend: string, trendType: 'up' | 'down' }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">{label}</p>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-headline text-primary font-bold">{value}</p>
          <span className={`text-[10px] font-bold mb-1 ${trendType === 'up' ? 'text-emerald-600' : 'text-error'}`}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}
