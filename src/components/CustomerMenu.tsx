import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'menuItems'), where('is_active', '==', true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Our Menu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md ${!item.is_available ? 'opacity-75' : ''}`}>
            {item.image_url && (
              <div className="h-48 w-full bg-gray-100 relative">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold tracking-wider uppercase text-sm shadow-lg transform -rotate-12">Sold Out</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                <span className="text-lg font-medium text-orange-600">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{item.category}</p>
              {item.description && (
                <p className="text-gray-600 mb-6 line-clamp-2">{item.description}</p>
              )}
              
              <button 
                disabled={!item.is_available}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  item.is_available 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {item.is_available ? 'Add to Order' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
