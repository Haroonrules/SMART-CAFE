import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Edit2, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WineItem {
  id: string;
  name: string;
  type: string;
  region: string;
  vintage: string;
  tasting_notes: string;
  price_glass: number;
  price_bottle: number;
  stock_status: string;
  image_url: string;
}

export function AdminWineScreen() {
  const [wines, setWines] = useState<WineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWine, setEditingWine] = useState<Partial<WineItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'wines'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WineItem[];
      
      setWines(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'wines');
    });

    return () => unsubscribe();
  }, []);

  const toggleStockStatus = async (wine: WineItem) => {
    const previousWines = [...wines];
    setWines(items => items.map(w => 
      w.id === wine.id ? { ...w, stock_status: w.stock_status === 'in_stock' ? 'sold_out' : 'in_stock' } : w
    ));

    try {
      // Get auth token from Firebase Auth instance directly
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        setWines(previousWines);
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to prevent 401 errors
      
      const response = await fetch(`/api/wines/${wine.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_status: wine.stock_status === 'in_stock' ? 'sold_out' : 'in_stock'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock status');
      }

      toast.success(`Marked as ${wine.stock_status === 'in_stock' ? 'Sold Out' : 'In Stock'}`);
    } catch (error: any) {
      setWines(previousWines);
      console.error('Toggle stock status error:', error);
      toast.error(error.message || 'Failed to update stock status');
      handleFirestoreError(error, OperationType.UPDATE, `wines/${wine.id}`);
    }
  };

  const deleteWine = async (id: string) => {
    try {
      // Get auth token from Firebase Auth instance directly
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to prevent 401 errors
      
      const response = await fetch(`/api/wines/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete wine');
      }

      toast.success('Wine removed successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to remove wine');
      handleFirestoreError(error, OperationType.UPDATE, `wines/${id}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWine) return;

    try {
      // Get auth token from Firebase Auth instance directly
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const token = await currentUser.getIdToken(true); // Force refresh to prevent 401 errors

      const payload = {
        name: editingWine.name,
        type: editingWine.type,
        region: editingWine.region,
        vintage: editingWine.vintage || '',
        price_glass: parseFloat(String(editingWine.price_glass || 0)),
        price_bottle: parseFloat(String(editingWine.price_bottle || 0)),
        stock_status: editingWine.stock_status || 'in_stock',
        tasting_notes: editingWine.tasting_notes || '',
        image_url: editingWine.image_url || ''
      };

      let response;
      if (editingWine.id) {
        response = await fetch(`/api/wines/${editingWine.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/wines', {
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
        throw new Error(errorData.error || 'Failed to save wine');
      }

      setIsModalOpen(false);
      setEditingWine(null);
      toast.success(editingWine.id ? 'Wine updated successfully' : 'Wine added successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save wine');
      handleFirestoreError(error, editingWine.id ? OperationType.UPDATE : OperationType.CREATE, 'wines');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wine Management</h1>
          <p className="text-gray-500 mt-2">Manage your wine cellar inventory and pricing.</p>
        </div>
        <button
          onClick={() => {
            setEditingWine({ name: '', type: '', region: '', vintage: '', tasting_notes: '', price_glass: 0, price_bottle: 0, stock_status: 'in_stock', image_url: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          Add New Wine
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Wine</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Region</th>
              <th className="p-4 font-medium">Price (Glass/Bottle)</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {wines.map(wine => (
              <tr key={wine.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    {wine.image_url ? (
                      <img src={wine.image_url} alt={wine.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No Img
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{wine.name}</p>
                      {wine.vintage && <span className="text-xs text-gray-500">{wine.vintage}</span>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{wine.type}</td>
                <td className="p-4 text-gray-600">{wine.region}</td>
                <td className="p-4 font-medium text-gray-900">
                  ${wine.price_glass?.toFixed(2)} / ${wine.price_bottle?.toFixed(2)}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleStockStatus(wine)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      wine.stock_status === 'in_stock'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {wine.stock_status === 'in_stock' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {wine.stock_status === 'in_stock' ? 'In Stock' : 'Sold Out'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingWine(wine);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Wine"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteWine(wine.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Wine"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {wines.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No wines found. Click "Add New Wine" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingWine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingWine.id ? 'Edit Wine' : 'Add Wine'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingWine.name || ''}
                  onChange={e => setEditingWine({...editingWine, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="e.g., Cabernet Sauvignon"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingWine.type || ''}
                    onChange={e => setEditingWine({...editingWine, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="">Select Type</option>
                    <option value="Red Wine">Red Wine</option>
                    <option value="White Wine">White Wine</option>
                    <option value="Rosé">Rosé</option>
                    <option value="Sparkling">Sparkling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={editingWine.region || ''}
                    onChange={e => setEditingWine({...editingWine, region: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="e.g., Napa Valley"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                  <input
                    type="text"
                    value={editingWine.vintage || ''}
                    onChange={e => setEditingWine({...editingWine, vintage: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="e.g., 2019"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                  <select
                    value={editingWine.stock_status || 'in_stock'}
                    onChange={e => setEditingWine({...editingWine, stock_status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Glass ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editingWine.price_glass || ''}
                    onChange={e => setEditingWine({...editingWine, price_glass: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Bottle ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editingWine.price_bottle || ''}
                    onChange={e => setEditingWine({...editingWine, price_bottle: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasting Notes</label>
                <textarea
                  value={editingWine.tasting_notes || ''}
                  onChange={e => setEditingWine({...editingWine, tasting_notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none h-24"
                  placeholder="Describe the flavor profile..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingWine.image_url || ''}
                  onChange={e => setEditingWine({...editingWine, image_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="https://..."
                />
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
                  Save Wine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
