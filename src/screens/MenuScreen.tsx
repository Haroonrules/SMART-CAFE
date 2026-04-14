import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, ArrowRight, Plus, X, Check, Loader2, Clock, TrendingUp } from 'lucide-react';
import { MenuItem, CustomizationGroup, ChatMessage } from '../types';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { chatWithAI } from '../lib/ai';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RitualRecommendation {
  item: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    description: string;
    category: string;
    customizations?: any[];
  };
  message: string;
  context: 'new_user' | 'all_time_favorite' | 'time_based';
  time_slot: 'morning' | 'lunch' | 'evening';
  stats?: {
    total_orders: number;
    orders_in_time_slot: number;
    confidence_score: number;
  };
}

export function MenuScreen() {
  const { addItem, items, subtotal, getItemPrice } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, string | string[]>>({});
  const [filter, setFilter] = useState<string>('All');
  
  // Map database categories to UI-friendly filter categories
  const filterCategories = ['All', 'Drinks', 'Food', 'Dessert'];
  
  const filteredItems = menuItems.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Drinks') {
      const categoryLower = item.category.toLowerCase();
      return categoryLower.includes('coffee') || categoryLower.includes('drink') || categoryLower.includes('tea') || categoryLower.includes('beverage');
    }
    if (filter === 'Food') return item.category === 'Food';
    if (filter === 'Dessert') return item.category === 'Dessert';
    return item.category === filter;
  });

  const [moodInput, setMoodInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'initial',
      role: 'assistant',
      text: "Welcome back! I'm your AI Concierge. How are you feeling today?",
      timestamp: new Date()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  
  // Smart Ritual state
  const [ritualData, setRitualData] = useState<RitualRecommendation | null>(null);
  const [isLoadingRitual, setIsLoadingRitual] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'menu_items'), where('is_active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Map snake_case image_url to camelCase image for UI consistency
          image: data.image_url || ''
        } as MenuItem;
      });
      setMenuItems(fetchedItems);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    });

    return () => unsubscribe();
  }, []);

  // Fetch personalized ritual recommendations
  useEffect(() => {
    const fetchRitual = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        return;
      }

      setIsLoadingRitual(true);
      try {
        // Get fresh token
        const token = await user.getIdToken(true);
        
        const response = await fetch(`${API_BASE_URL}/api/customer/ritual`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRitualData(data);
      } catch (error: any) {
        console.error('[RITUAL] Error fetching ritual:', error);
        // Don't show toast for ritual errors - it's a nice-to-have feature
      } finally {
        setIsLoadingRitual(false);
      }
    };

    fetchRitual();
  }, []);

  const handleConciergeSubmit = async () => {
    if (!moodInput.trim() || isThinking) return;
    
    const userMessage = moodInput.trim();
    setMoodInput('');
    
    // Add user message to history
    const userChat: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userChat]);
    
    setIsThinking(true);
    try {
      const historyForApi = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.text
      }));
      const result = await chatWithAI(userMessage, 'cafe', menuItems, historyForApi);
      
      const assistantChat: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.text,
        items: result.items,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantChat]);
      
    } catch (error) {
      console.error(error);
      const errorChat: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm having trouble thinking right now. How about a classic espresso?",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorChat]);
    } finally {
      setIsThinking(false);
    }
  };

  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    // Initialize defaults for single choice groups
    const defaults: Record<string, string | string[]> = {};
    (item.customizations || []).forEach(group => {
      if (group.type === 'single') {
        defaults[group.id] = group.options[0].id;
      } else {
        defaults[group.id] = [];
      }
    });
    setCustomizations(defaults);
  };

  const handleOptionToggle = (groupId: string, optionId: string, type: 'single' | 'multiple') => {
    setCustomizations(prev => {
      if (type === 'single') {
        // For flat array customizations, toggle boolean value
        return { ...prev, [optionId]: !prev[optionId] };
      } else {
        const current = (prev[groupId] as string[]) || [];
        const next = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [groupId]: next };
      }
    });
  };

  const handleAddToCart = () => {
    if (selectedItem) {
      addItem(selectedItem, customizations);
      setSelectedItem(null);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 md:py-12">
      {/* Hero Section - Smart Ritual */}
      <section className="mb-16">
        {isLoadingRitual ? (
          // Loading skeleton
          <div className="relative overflow-hidden rounded-xl bg-primary-container text-white p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-headline">Curating your ritual...</p>
            </div>
          </div>
        ) : ritualData ? (
          // Personalized ritual widget
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container to-secondary-container text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <img 
                src={ritualData.item.image_url || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800"} 
                alt="Ritual background"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-secondary-container" />
                <span className="inline-block text-[0.75rem] font-label tracking-[0.15rem] uppercase opacity-80">
                  {ritualData.time_slot === 'morning' ? 'Morning Ritual' : 
                   ritualData.time_slot === 'lunch' ? 'Lunch Ritual' : 'Evening Ritual'}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-headline mb-4 leading-tight">
                {ritualData.message}
              </h1>
              
              {/* Primary Recommendation Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-start gap-4">
                  {ritualData.item.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-lg">
                      <img 
                        src={ritualData.item.image_url}
                        alt={ritualData.item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-headline italic mb-2">{ritualData.item.name}</h3>
                      <span className="text-lg font-bold text-secondary-container">${ritualData.item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm opacity-90 mb-3 line-clamp-2">{ritualData.item.description}</p>
                    
                    {/* Stats badge for context */}
                    {ritualData.stats && ritualData.stats.orders_in_time_slot > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} className="text-secondary-container" />
                        <span className="text-xs opacity-80">
                          Ordered {ritualData.stats.orders_in_time_slot} time{ritualData.stats.orders_in_time_slot !== 1 ? 's' : ''} at this time
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          // Find the full menu item with customizations
                          const fullItem = menuItems.find(m => m.id === ritualData.item.id);
                          if (fullItem) {
                            openCustomization(fullItem);
                          } else {
                            // Fallback: create minimal item and add directly
                            const minimalItem: MenuItem = {
                              id: ritualData.item.id,
                              name: ritualData.item.name,
                              price: ritualData.item.price,
                              image: ritualData.item.image_url || '',
                              description: ritualData.item.description,
                              category: ritualData.item.category,
                              customizations: ritualData.item.customizations || [],
                              is_active: true,
                            };
                            addItem(minimalItem, {});
                            toast.success(`Added ${ritualData.item.name} to cart!`);
                          }
                        }}
                        className="bg-secondary-container text-on-secondary-container px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-lg"
                      >
                        <ShoppingBag size={16} />
                        Order Now
                      </button>
                      {menuItems.find(m => m.id === ritualData.item.id) && (
                        <button 
                          onClick={() => {
                            const fullItem = menuItems.find(m => m.id === ritualData.item.id);
                            if (fullItem) openCustomization(fullItem);
                          }}
                          className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-lg font-semibold hover:bg-white/20 transition-all"
                        >
                          Customize
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Context indicator */}
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Sparkles size={14} />
                <span>
                  {ritualData.context === 'new_user' ? 'Based on popular choices' :
                   ritualData.context === 'all_time_favorite' ? 'Your all-time favorite' :
                   'Personalized for this time of day'}
                </span>
              </div>
            </div>
            
            {/* Decorative element */}
            <div className="relative z-10 hidden lg:block w-64 h-64 -mr-8 translate-y-4 rotate-3 group-hover:rotate-0 transition-transform duration-700">
              <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-white/10">
                <img 
                  src={ritualData.item.image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"}
                  alt={ritualData.item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        ) : (
          // Unauthenticated fallback
          <div className="relative overflow-hidden rounded-xl bg-stone-100 border-2 border-dashed border-stone-300 text-stone-500 p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-headline mb-2">Sign in to see your Ritual</h2>
              <p className="text-sm mb-4">Get personalized recommendations based on your order history</p>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Sign In
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Concierge Section */}
      <section className="mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline text-primary">The Concierge</h2>
              <p className="text-on-surface-variant font-body">Tell us how you're feeling, and we'll curate your experience.</p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 to-tertiary/20 rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
              <div className="relative bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
                <textarea 
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleConciergeSubmit();
                    }
                  }}
                  className="w-full bg-transparent border-none focus:ring-0 text-lg font-body text-primary placeholder:text-stone-400 resize-none h-24" 
                  placeholder="e.g., I'm feeling a bit tired and want something sweet..."
                ></textarea>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[0.65rem] font-label text-stone-400 uppercase tracking-widest">
                    {isThinking ? 'AI Concierge is Thinking...' : 'AI Concierge is Listening'}
                  </span>
                  <button 
                    onClick={handleConciergeSubmit}
                    disabled={isThinking || !moodInput.trim()}
                    className="bg-primary text-white p-3 rounded-full hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isThinking ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-stone-200">
              {chatHistory.map((chat) => (
                <div key={chat.id} className={`flex gap-4 items-start ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    chat.role === 'assistant' ? 'bg-tertiary-fixed' : 'bg-primary-container'
                  }`}>
                    {chat.role === 'assistant' ? (
                      <Sparkles className="text-on-tertiary-fixed" size={20} />
                    ) : (
                      <ShoppingBag className="text-white" size={20} />
                    )}
                  </div>
                  <div className="flex flex-col gap-3 max-w-[85%]">
                    <div className={`rounded-2xl p-4 shadow-sm ${
                      chat.role === 'assistant' 
                        ? 'bg-surface-container-high rounded-tl-none' 
                        : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      <p className={`leading-relaxed ${chat.role === 'assistant' ? 'font-headline italic text-primary' : 'font-body'}`}>
                        {chat.text}
                      </p>
                    </div>

                    {/* Recommendation Cards */}
                    {chat.items && chat.items.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {chat.items.map((item) => (
                          <div key={item.id} className="min-w-[200px] bg-white rounded-xl overflow-hidden shadow-md border border-outline-variant/10 flex flex-col">
                            <div className="h-32 overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="p-4 flex-grow flex flex-col">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-headline text-sm text-primary line-clamp-1">{item.name}</h4>
                                <span className="text-secondary font-bold text-xs">${(item.price || (item as any).price_glass || 0).toFixed(2)}</span>
                              </div>
                              <p className="text-[10px] text-on-surface-variant line-clamp-2 mb-3 flex-grow">{item.description}</p>
                              <button 
                                onClick={() => openCustomization(item)}
                                className="w-full py-2 rounded-lg bg-secondary text-white text-xs font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-1"
                              >
                                <Plus size={12} />
                                Customize
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0 animate-pulse">
                    <Sparkles className="text-on-tertiary-fixed" size={20} />
                  </div>
                  <div className="bg-surface-container-high rounded-2xl rounded-tl-none p-4">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-col md:flex-row gap-6">
              {menuItems.slice(0, 2).map(item => (
                <div key={item.id} className="flex-1 group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-outline-variant/10">
                  <div className="h-48 overflow-hidden relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    {item.badge && (
                      <div className="absolute top-4 left-4 bg-tertiary text-white text-[0.6rem] font-label uppercase tracking-widest px-2 py-1 rounded">{item.badge}</div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-headline text-xl text-primary">{item.name}</h3>
                      <span className="text-secondary font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">{item.description}</p>
                    <button 
                      onClick={() => openCustomization(item)}
                      className="w-full py-2.5 rounded-lg border border-secondary text-secondary font-semibold hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Customize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-6">
          <div>
            <span className="text-[0.75rem] font-label tracking-[0.2rem] uppercase text-stone-400 mb-2 block">Curation</span>
            <h2 className="text-4xl font-headline text-primary">Explore the Menu</h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {filterCategories.map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-full font-label text-[0.7rem] uppercase tracking-widest font-bold transition-colors ${
                  filter === f 
                    ? 'bg-surface-container-highest text-primary' 
                    : 'text-stone-400 hover:bg-stone-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
          {filteredItems.map(item => (
            <div key={item.id} className="group cursor-pointer" onClick={() => openCustomization(item)}>
              <div className="aspect-[4/5] overflow-hidden rounded-xl mb-6 relative shadow-lg">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-primary px-6 py-2 rounded-full font-label text-xs uppercase tracking-widest font-bold scale-90 group-hover:scale-100 transition-transform">Customize</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[0.6rem] font-label text-secondary uppercase tracking-widest mb-1 block">Smooth & Bold</span>
                  <h3 className="text-2xl font-headline text-primary">{item.name}</h3>
                </div>
                <span className="text-lg font-headline italic text-primary">${item.price.toFixed(2)}</span>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant font-light leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Cart Button */}
      {items.length > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50">
          <Link to="/cart" className="bg-primary text-on-primary px-6 py-3 rounded-full shadow-[0px_16px_32px_rgba(38,23,12,0.2)] flex items-center gap-3 active:scale-95 transition-transform group">
            <div className="flex items-center gap-2 border-r border-on-primary/20 pr-3">
              <ShoppingBag className="text-secondary-container" size={20} />
              <span className="font-bold text-sm">{items.reduce((acc, i) => acc + i.quantity, 0)} Items</span>
            </div>
            <span className="font-medium text-sm text-secondary-container">• ${subtotal.toFixed(2)}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      {/* Customization Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 flex justify-between items-start border-b border-stone-100">
                <div className="flex gap-6">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-headline text-primary mb-1">{selectedItem.name}</h2>
                    <p className="text-sm text-on-surface-variant line-clamp-1">{selectedItem.description}</p>
                    <p className="text-lg font-headline italic text-secondary mt-2">
                      ${getItemPrice(selectedItem, customizations).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-stone-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-10">
                {(selectedItem.customizations || []).length > 0 ? (
                  <section>
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="font-headline text-xl text-primary italic">Customizations</h3>
                      <span className="text-[10px] font-label uppercase tracking-widest text-stone-400">
                        Select Options
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedItem.customizations || []).map((customization: any, index: number) => {
                        const customizationId = `custom_${index}`;
                        const isSelected = customizations[customizationId] === true;
                        
                        return (
                          <button
                            key={customizationId}
                            onClick={() => handleOptionToggle('custom', customizationId, 'single')}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected 
                                ? 'border-secondary bg-secondary/5 shadow-sm' 
                                : 'border-stone-100 hover:border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-secondary border-secondary' : 'border-stone-300'
                              }`}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                              <span className={`font-medium ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {customization.name}
                              </span>
                            </div>
                            {customization.extra_price && customization.extra_price > 0 && (
                              <span className="text-xs font-headline text-stone-400">
                                +${customization.extra_price.toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <p className="text-center text-stone-400 py-8">No customizations available for this item.</p>
                )}
              </div>

              <div className="p-6 md:p-8 border-t border-stone-100 bg-stone-50/50">
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  Add to Ritual • ${getItemPrice(selectedItem, customizations).toFixed(2)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
