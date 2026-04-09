import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  customizations: { name: string; extra_price: number }[];
  description?: string;
  is_available?: boolean;
}

export function AdminMenuScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    image_url: '',
    category: 'Coffee',
    customizations: []
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'menu_items'));
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setNewItem(prev => ({
      ...prev,
      customizations: [...(prev.customizations || []), { name: '', extra_price: 0 }]
    }));
  };

  const handleOptionChange = (index: number, field: 'name' | 'extra_price', value: string | number) => {
    setNewItem(prev => {
      const updated = [...(prev.customizations || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customizations: updated };
    });
  };

  const removeOption = (index: number) => {
    setNewItem(prev => ({
      ...prev,
      customizations: prev.customizations?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newItem)
        });

        if (!response.ok) throw new Error('Failed to update item');
        toast.success('Menu item updated successfully!');
      } else {
        // Add new item
        const response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newItem)
        });

        if (!response.ok) throw new Error('Failed to save item');
        toast.success('Menu item added successfully!');
      }
      
      setShowModal(false);
      setEditingItem(null);
      fetchItems();
      setNewItem({ name: '', price: 0, image_url: '', category: 'Coffee', customizations: [] });
    } catch (error) {
      console.error(error);
      toast.error(editingItem ? 'Error updating menu item' : 'Error saving menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      category: item.category,
      customizations: item.customizations || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete item');
      toast.success('Menu item deleted successfully!');
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting menu item');
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_available: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update availability');
      toast.success(`Item marked as ${!currentStatus ? 'Available' : 'Unavailable'}`);
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error('Error updating availability');
    }
  };

  return (
    <main className="ml-64 p-10 bg-surface-container-lowest min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-5xl font-headline text-primary">Menu Management</h1>
          <p className="text-stone-500 mt-2">Manage items and their dynamic customizations</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setNewItem({ name: '', price: 0, image_url: '', category: 'Coffee', customizations: [] });
            setShowModal(true);
          }}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
        >
          <Plus size={20} /> Add Item
        </button>
      </header>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-3xl border border-stone-200/30 shadow-sm overflow-hidden">
            <img 
              src={item.image_url || 'https://via.placeholder.com/400'} 
              alt={item.name} 
              className="w-full h-48 object-cover"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400'; }}
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-headline text-primary">{item.name}</h3>
                <span className={`text-[10px] font-label uppercase font-bold px-2 py-1 rounded-full ${
                  item.is_available !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.is_available !== false ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-secondary font-bold">${item.price.toFixed(2)}</p>
              {item.customizations && item.customizations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-xs font-label uppercase text-stone-400 mb-2">Customizations:</p>
                  <ul className="text-sm text-stone-600 space-y-1">
                    {item.customizations.map((c, idx) => (
                      <li key={idx}>+ {c.name} (${c.extra_price.toFixed(2)})</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              
              <button
                onClick={() => handleToggleAvailability(item.id, item.is_available !== false)}
                className={`w-full mt-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  item.is_available !== false 
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {item.is_available !== false ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Item Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-headline text-primary mb-8 italic">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input required placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-6">
                  <input required type="number" step="0.01" placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                  <input required placeholder="Image URL" value={newItem.image_url} onChange={e => setNewItem({...newItem, image_url: e.target.value})} className="w-full bg-stone-50 border-b border-stone-200 py-3 px-4 outline-none focus:border-primary" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-label font-bold tracking-widest uppercase text-stone-400">Customizations</label>
                    <button type="button" onClick={handleAddOption} className="text-xs text-secondary font-bold hover:underline">+ Add Option</button>
                  </div>
                  {newItem.customizations?.map((opt, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <input placeholder="Option Name (e.g. Oat Milk)" value={opt.name} onChange={e => handleOptionChange(idx, 'name', e.target.value)} className="flex-1 bg-stone-50 border-b border-stone-200 py-2 px-3 text-sm outline-none focus:border-primary" />
                      <input type="number" step="0.01" placeholder="+$" value={opt.extra_price} onChange={e => handleOptionChange(idx, 'extra_price', parseFloat(e.target.value))} className="w-24 bg-stone-50 border-b border-stone-200 py-2 px-3 text-sm outline-none focus:border-primary" />
                      <button type="button" onClick={() => removeOption(idx)} className="text-error"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 hover:scale-[1.01] active:scale-95 transition-all">
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
