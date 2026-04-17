import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MenuItem, CustomizationGroup } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Edit2, Trash2, Plus, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Customization {
  name: string;
  extra_price: number;
}

export function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> & { customizations?: Customization[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      
      // Sort by name only (no inactive items with hard deletes)
      items.sort((a, b) => a.name.localeCompare(b.name));
      
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    });

    return () => unsubscribe();
  }, []);

  const toggleAvailability = async (item: MenuItem) => {
    // Optimistic UI update - set both is_available and is_active to false when marking as sold out
    const previousItems = [...menuItems];
    const newStatus = !item.is_available;
    setMenuItems(items => items.map(i => 
      i.id === item.id ? { ...i, is_available: newStatus, is_active: newStatus } : i
    ));

    try {
      // Get auth token from Firebase Auth instance directly
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        // Revert on failure
        setMenuItems(previousItems);
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to prevent 401 errors
      
      const response = await fetch(`/api/menu/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_available: newStatus,
          is_active: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update availability');
      }

      toast.success(newStatus ? 'Item activated and available' : 'Item deactivated and sold out');
    } catch (error: any) {
      // Revert on failure
      setMenuItems(previousItems);
      console.error('Toggle availability error:', error);
      toast.error(error.message || 'Failed to update availability');
      handleFirestoreError(error, OperationType.UPDATE, `menuItems/${item.id}`);
    }
  };

  const deleteItem = async (id: string) => {
    // Using a custom confirmation approach or just direct action since window.confirm is blocked in iframes
    try {
      // Get auth token from Firebase Auth instance
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to prevent 401 errors
      
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }

      toast.success('Item removed from menu');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to remove item');
      handleFirestoreError(error, OperationType.UPDATE, `menuItems/${id}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      // Get auth token from Firebase Auth instance
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to prevent 401 errors

      // Prepare payload with proper number parsing
      const payload = {
        name: editingItem.name,
        category: editingItem.category,
        price: parseFloat(String(editingItem.price || 0)),
        image_url: editingItem.image_url || '',
        description: editingItem.description || '',
        is_available: editingItem.is_available !== false,
        customizations: (editingItem.customizations || []).map(c => ({
          name: c.name,
          extra_price: parseFloat(String(c.extra_price || 0))
        }))
      };

      let response;
      if (editingItem.id) {
        // Update existing item via API
        response = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new item via API
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save item');
      }

      // Only update UI after successful API response
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success(editingItem.id ? 'Item updated successfully' : 'Item added successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save item');
      handleFirestoreError(error, editingItem.id ? OperationType.UPDATE : OperationType.CREATE, 'menuItems');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Administration</h1>
          <p className="text-gray-500 mt-2">Manage your restaurant's menu items, availability, and pricing.</p>
        </div>
        <button
          onClick={() => {
            setEditingItem({ name: '', category: '', price: 0, description: '', image_url: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Item</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {menuItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No Img
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{item.category}</td>
                <td className="p-4 font-medium text-gray-900">${item.price.toFixed(2)}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      item.is_active && item.is_available
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {item.is_active && item.is_available ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {item.is_active && item.is_available ? 'Available' : 'Sold Out'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {menuItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No menu items found. Click "Add New Item" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem.id ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="e.g., Spicy Tacos"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={editingItem.category || ''}
                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="e.g., Mains"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editingItem.price || ''}
                    onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none h-24"
                  placeholder="Describe the dish..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingItem.image_url || ''}
                  onChange={e => setEditingItem({...editingItem, image_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              {/* Customizations Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Customizations</label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingItem.customizations || [];
                      setEditingItem({
                        ...editingItem,
                        customizations: [...current, { name: '', extra_price: 0 }]
                      });
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add Customization
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(editingItem.customizations || []).map((customization, index) => (
                    <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={customization.name}
                          onChange={e => {
                            const updated = [...(editingItem.customizations || [])];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setEditingItem({ ...editingItem, customizations: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          placeholder="e.g., Extra Shot"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={customization.extra_price}
                          onChange={e => {
                            const updated = [...(editingItem.customizations || [])];
                            updated[index] = { ...updated[index], extra_price: parseFloat(e.target.value) || 0 };
                            setEditingItem({ ...editingItem, customizations: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingItem.customizations || []).filter((_, i) => i !== index);
                          setEditingItem({ ...editingItem, customizations: updated });
                        }}
                        className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove customization"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {(editingItem.customizations || []).length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      No customizations added. Click "Add Customization" to create options like "Extra Shot", "Oat Milk", etc.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
