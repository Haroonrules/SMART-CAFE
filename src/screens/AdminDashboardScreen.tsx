import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem } from '../types';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { auth } from '../firebase';

export function AdminDashboardScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Coffee',
    image_url: '',
    customizations: [] as Array<{ name: string; extra_price: number }>
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Coffee',
      image_url: '',
      customizations: []
    });
    setEditingItem(null);
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category,
        image_url: item.image_url || '',
        customizations: item.customizations || []
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleAddCustomization = () => {
    setFormData(prev => ({
      ...prev,
      customizations: [...prev.customizations, { name: '', extra_price: 0 }]
    }));
  };

  const handleUpdateCustomization = (index: number, field: 'name' | 'extra_price', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((cust, i) => 
        i === index ? { ...cust, [field]: field === 'extra_price' ? parseFloat(value as string) || 0 : value } : cust
      )
    }));
  };

  const handleRemoveCustomization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to edit menu items. Please log in again.');
      }

      console.log('Getting ID token for user:', user.email);
      const token = await user.getIdToken();
      console.log('Token obtained, length:', token.length);
      
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: formData.image_url || `https://picsum.photos/seed/${Date.now()}/400/400`,
        customizations: formData.customizations,
        is_active: true,
        is_available: true,
        updated_at: serverTimestamp()
      };

      let response;
      if (editingItem) {
        // Update existing item
        console.log('Updating menu item:', editingItem.id);
        response = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(itemData)
        });
      } else {
        // Add new item
        console.log('Adding new menu item');
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(itemData)
        });
      }

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      toast.success(editingItem ? 'Menu item updated successfully!' : 'Menu item added successfully!');
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Full error details:', error);
      toast.error(error.message || (editingItem ? 'Error updating menu item' : 'Error adding menu item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to delete menu items.');
      }

      console.log('Deleting menu item:', id);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete API error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      toast.success('Menu item deleted successfully!');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Error deleting menu item');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found during availability toggle');
        throw new Error('Authentication required to update availability.');
      }

      console.log('Toggling availability for item:', id);
      const token = await user.getIdToken();
      const response = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_available: !currentStatus })
      });

      console.log('Toggle availability response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Toggle availability API error:', errorData);
        throw new Error(errorData.error || 'Failed to update availability');
      }
      toast.success(currentStatus ? 'Item marked as unavailable' : 'Item marked as available');
    } catch (error: any) {
      console.error('Full toggle availability error details:', error);
      toast.error(error.message || 'Error updating availability');
    }
  };

  if (loading) {
    return (
      <div className="ml-64 p-10 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <main className="ml-64 p-10 bg-surface-container-lowest min-h-screen">
      <header className="flex justify-between items-end mb-12">
        <div>
          <span className="text-[0.75rem] font-label tracking-[0.2em] text-stone-400 uppercase mb-2 block">Menu Management</span>
          <h1 className="text-5xl font-headline text-primary">Food & Beverages</h1>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-6 w-80 font-body text-sm outline-none focus:border-primary transition-colors" 
              placeholder="Search menu items..." 
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex gap-3 mb-8">
        {['all', 'Coffee', 'Tea', 'Food', 'Dessert'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-6 py-2 rounded-full font-label text-xs uppercase tracking-widest transition-all ${
              categoryFilter === cat 
                ? 'bg-primary text-white' 
                : 'bg-white border border-stone-200 text-stone-500 hover:border-primary'
            }`}
          >
            {cat === 'all' ? 'All Items' : cat}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl overflow-hidden border border-stone-200/30 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative h-48 bg-stone-100">
              <img 
                src={item.image_url || 'https://via.placeholder.com/400'} 
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
                }}
              />
              {!item.is_available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                    Unavailable
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-headline text-xl text-primary font-bold">{item.name}</h3>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">{item.category}</p>
                </div>
                <p className="text-2xl font-headline text-secondary font-bold">${item.price.toFixed(2)}</p>
              </div>
              
              {item.description && (
                <p className="text-sm text-stone-500 mb-4 line-clamp-2">{item.description}</p>
              )}
              
              {item.customizations && item.customizations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Customizations:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.customizations.map((cust, idx) => (
                      <span key={idx} className="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-600">
                        {cust.name} (+${cust.extra_price.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t border-stone-100">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-primary py-2 rounded-xl font-label text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => toggleAvailability(item.id, item.is_available ?? true)}
                  className={`py-2 px-4 rounded-xl transition-colors ${
                    item.is_available 
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                  title={item.is_available ? 'Mark as unavailable' : 'Mark as available'}
                >
                  {item.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="py-2 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  title="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-stone-300 mb-4" size={48} />
          <p className="text-stone-400 font-label uppercase tracking-widest">No menu items found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-headline text-primary">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Cappuccino"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors resize-none"
                    rows={3}
                    placeholder="Brief description of the item..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                      required
                    >
                      <option value="Coffee">Coffee</option>
                      <option value="Tea">Tea</option>
                      <option value="Food">Food</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-stone-400 mt-1">Leave empty for auto-generated image</p>
                </div>

                {/* Customizations Section */}
                <div className="border-t border-stone-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs uppercase tracking-widest text-stone-500">Customizations</label>
                    <button
                      type="button"
                      onClick={handleAddCustomization}
                      className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Option
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.customizations.map((cust, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={cust.name}
                          onChange={(e) => handleUpdateCustomization(index, 'name', e.target.value)}
                          className="flex-1 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors text-sm"
                          placeholder="Option name (e.g., Extra Shot)"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={cust.extra_price}
                          onChange={(e) => handleUpdateCustomization(index, 'extra_price', e.target.value)}
                          className="w-32 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors text-sm"
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomization(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    
                    {formData.customizations.length === 0 && (
                      <p className="text-sm text-stone-400 text-center py-4">No customizations added yet</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-xl font-label text-sm uppercase tracking-widest hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-label text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Saving...
                      </>
                    ) : (
                      editingItem ? 'Update Item' : 'Add Item'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
