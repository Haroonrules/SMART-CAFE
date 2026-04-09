import React, { useState, useEffect } from 'react';
import { Plus, Wine, Loader2, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

interface WineItem {
  id: string;
  name: string;
  type: 'Red' | 'White' | 'Sparkling' | 'Rose';
  region: string;
  price_bottle: number;
  price_glass: number;
  stock_status: 'in_stock' | 'low' | 'out_of_stock';
  tasting_notes: string;
  image_url: string;
  vintage?: string;
}

export function AdminWineScreen() {
  const [wines, setWines] = useState<WineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWine, setEditingWine] = useState<WineItem | null>(null);
  const [newWine, setNewWine] = useState<Partial<WineItem>>({
    name: '', type: 'Red', region: '', price_bottle: 0, 
    price_glass: 0, stock_status: 'in_stock', tasting_notes: '', image_url: '', vintage: ''
  });

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'wines'));
      setWines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WineItem)));
    } catch (error) {
      toast.error('Failed to load wines');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (editingWine) {
        // Update existing wine
        const response = await fetch(`/api/wines/${editingWine.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newWine)
        });
        if (!response.ok) throw new Error('Failed to update wine');
        toast.success('Wine updated successfully!');
      } else {
        // Add new wine
        const response = await fetch('/api/wines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newWine)
        });
        if (!response.ok) throw new Error('Failed to save wine');
        toast.success('Wine added successfully!');
      }
      
      setShowModal(false);
      setEditingWine(null);
      fetchWines();
      setNewWine({
        name: '', type: 'Red', region: '', price_bottle: 0, 
        price_glass: 0, stock_status: 'in_stock', tasting_notes: '', image_url: '', vintage: ''
      });
    } catch (error) {
      toast.error(editingWine ? 'Error updating wine' : 'Error saving wine');
    }
  };

  const handleEdit = (wine: WineItem) => {
    setEditingWine(wine);
    setNewWine({
      name: wine.name,
      type: wine.type,
      region: wine.region,
      price_bottle: wine.price_bottle,
      price_glass: wine.price_glass,
      stock_status: wine.stock_status,
      tasting_notes: wine.tasting_notes,
      image_url: wine.image_url,
      vintage: wine.vintage || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/wines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete wine');
      toast.success('Wine deleted successfully!');
      fetchWines();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting wine');
    }
  };

  const handleToggleStockStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'in_stock' ? 'out_of_stock' : 'in_stock';
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/wines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ stock_status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update stock status');
      toast.success(`Wine marked as ${newStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}`);
      fetchWines();
    } catch (error) {
      console.error(error);
      toast.error('Error updating stock status');
    }
  };

  return (
    <main className="ml-64 p-10 bg-surface-container-lowest min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-5xl font-headline text-primary">Wine Cellar Management</h1>
        <button 
          onClick={() => {
            setEditingWine(null);
            setNewWine({
              name: '', type: 'Red', region: '', price_bottle: 0, 
              price_glass: 0, stock_status: 'in_stock', tasting_notes: '', image_url: '', vintage: ''
            });
            setShowModal(true);
          }}
          className="bg-secondary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg hover:scale-[1.02] transition-transform"
        >
          <Plus size={20} /> Add Wine
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {wines.map(wine => (
          <div key={wine.id} className="bg-white rounded-3xl border border-stone-200/30 shadow-sm overflow-hidden">
            <img 
              src={wine.image_url || 'https://via.placeholder.com/400'} 
              alt={wine.name} 
              className="w-full h-48 object-cover"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400'; }}
            />
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-headline text-primary">{wine.name}</h3>
                <span className={`text-[10px] font-label uppercase font-bold px-2 py-1 rounded-full ${
                  wine.stock_status === 'in_stock' ? 'bg-emerald-100 text-emerald-700' : 
                  wine.stock_status === 'low' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {wine.stock_status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-stone-500 text-sm mt-1">{wine.region}{wine.vintage ? ` • ${wine.vintage}` : ''}</p>
              <p className="text-secondary font-bold mt-2">${wine.price_bottle.toFixed(2)} / Bottle</p>
              {wine.price_glass > 0 && (
                <p className="text-stone-400 text-sm">${wine.price_glass.toFixed(2)} / Glass</p>
              )}
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(wine)}
                  className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(wine.id, wine.name)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              
              <button
                onClick={() => handleToggleStockStatus(wine.id, wine.stock_status)}
                className={`w-full mt-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  wine.stock_status === 'in_stock'
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {wine.stock_status === 'in_stock' ? 'Mark Out of Stock' : 'Mark In Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Wine Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors"><X size={20} className="text-stone-400" /></button>
              <h2 className="text-3xl font-headline text-primary mb-8 italic">
                {editingWine ? 'Edit Wine' : 'Add New Wine'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input required placeholder="Wine Name" value={newWine.name} onChange={e => setNewWine({...newWine, name: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                
                <div className="grid grid-cols-3 gap-6">
                  <select value={newWine.type} onChange={e => setNewWine({...newWine, type: e.target.value as any})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary">
                    <option value="Red">Red</option>
                    <option value="White">White</option>
                    <option value="Sparkling">Sparkling</option>
                    <option value="Rose">Rosé</option>
                  </select>
                  <input required placeholder="Region" value={newWine.region} onChange={e => setNewWine({...newWine, region: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                  <input placeholder="Vintage (Optional)" value={newWine.vintage} onChange={e => setNewWine({...newWine, vintage: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <input required type="number" step="0.01" placeholder="Price per Bottle" value={newWine.price_bottle} onChange={e => setNewWine({...newWine, price_bottle: parseFloat(e.target.value)})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                  <input type="number" step="0.01" placeholder="Price per Glass (Optional)" value={newWine.price_glass} onChange={e => setNewWine({...newWine, price_glass: parseFloat(e.target.value)})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Tasting Notes</label>
                  <textarea required rows={3} value={newWine.tasting_notes} onChange={e => setNewWine({...newWine, tasting_notes: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary resize-none" placeholder="Describe the flavor profile..." />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <input required placeholder="Image URL" value={newWine.image_url} onChange={e => setNewWine({...newWine, image_url: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                  <select value={newWine.stock_status} onChange={e => setNewWine({...newWine, stock_status: e.target.value as any})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary">
                    <option value="in_stock">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <button className="w-full bg-secondary text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-secondary/20 mt-4 hover:scale-[1.01] active:scale-95 transition-all">
                  {editingWine ? 'Update Wine' : 'Save Wine'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
