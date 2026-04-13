import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ShoppingBag, ArrowRight, Plus, X, Check, Loader2, Send } from 'lucide-react';
import { MenuItem, ChatMessage, WineItem } from '../types';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { chatWithAI } from '../lib/ai';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function WineListScreen() {
  const { addItem, items, subtotal } = useCart();
  const [wineItems, setWineItems] = useState<MenuItem[]>([]);
  const [rawWines, setRawWines] = useState<WineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'glass' | 'bottle'>>({});

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'initial',
      role: 'assistant',
      text: "Good evening. I am your Sommelier. How may I assist you in finding the perfect wine tonight?",
      timestamp: new Date()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    // Fetch wines from backend API instead of direct Firestore
    const fetchWines = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/wines');
        
        if (!response.ok) {
          throw new Error('Failed to fetch wines');
        }

        const data = await response.json();
        const fetchedWines: WineItem[] = data.wines || [];
        
        // Store raw wine data for price reference
        setRawWines(fetchedWines);
        
        // Map wine schema to MenuItem-compatible format for UI consistency
        const availableWines: MenuItem[] = fetchedWines.map(wine => ({
          id: wine.id,
          name: wine.name,
          description: wine.tasting_notes || '',
          price: wine.price_glass || wine.price_bottle || 0,
          category: 'Wine' as const,
          image: wine.image_url || '',
          customizations: [],
          tags: [wine.type, wine.region].filter(Boolean),
          badge: wine.vintage || undefined,
          isAvailable: true,
          is_active: true,
          is_available: true
        }));
        
        setWineItems(availableWines);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching wines:', error);
        handleFirestoreError(error, OperationType.LIST, 'wines');
        setLoading(false);
      }
    };

    fetchWines();
  }, []);

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isThinking) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
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
      const result = await chatWithAI(userMessage, 'wine', rawWines, historyForApi);
      
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
        text: "I apologize, but I am having trouble accessing my cellar notes at the moment. Perhaps a classic Cabernet?",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorChat]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    // Find the original wine data to get both prices
    const wine = rawWines.find(w => w.id === item.id);
    if (!wine) return;
    
    const size = selectedSizes[wine.id] || 'glass';
    const price = size === 'glass' ? wine.price_glass : wine.price_bottle;
    const sizeLabel = size === 'glass' ? '(Glass)' : '(Bottle)';
    
    // Create cart item with size information
    const cartItem: MenuItem = {
      id: `${wine.id}-${size}`,
      name: `${wine.name} ${sizeLabel}`,
      description: wine.tasting_notes || '',
      price: price,
      category: 'Wine' as const,
      image: wine.image_url || '',
      customizations: [],
      tags: [wine.type, wine.region].filter(Boolean),
      badge: wine.vintage || undefined,
      isAvailable: true,
      is_active: true,
      is_available: true
    };
    
    addItem(cartItem);
  };

  const filteredItems = wineItems.filter(item => filter === 'All' || item.tags?.includes(filter));

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 md:py-12">
      {/* Wine Hero */}
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a0f0a] text-white p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 group">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7df?auto=format&fit=crop&q=80&w=2000" 
              alt="Wine cellar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f0a] via-[#1a0f0a]/80 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block text-[0.75rem] font-label tracking-[0.3rem] uppercase mb-6 text-secondary-container opacity-90">The Sommelier's Selection</span>
            <h1 className="text-4xl md:text-6xl font-headline mb-8 leading-tight">Elevate your <br/><span className="italic text-secondary-container">Evening Ritual.</span></h1>
            <p className="text-lg text-stone-300 mb-10 font-body max-w-lg leading-relaxed">
              Our Sommelier has curated a list of exceptional vintages, from the rolling hills of Napa to the heritage vines of Lodi.
            </p>
            <div className="flex flex-wrap gap-6">
              <button 
                onClick={() => document.getElementById('sommelier-chat')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-secondary text-on-secondary px-10 py-4 rounded-xl font-semibold flex items-center gap-3 hover:scale-[0.98] transition-transform shadow-2xl shadow-black/40"
              >
                Speak to Sommelier
                <Sparkles size={18} />
              </button>
            </div>
          </div>

          <div className="relative z-10 hidden xl:block w-80 h-[400px] -mr-12 translate-y-8">
             <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 rotate-2 group-hover:rotate-0 transition-transform duration-1000">
                <img 
                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800" 
                  alt="Featured Wine"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
             </div>
          </div>
        </div>
      </section>

      {/* Sommelier Chat Section */}
      <section id="sommelier-chat" className="mb-16 scroll-mt-24">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-6 md:p-10 shadow-sm flex flex-col h-[600px]">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-outline-variant/30">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <Sparkles className="text-on-secondary-container" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-headline text-primary">Sommelier</h2>
              <p className="text-sm font-label text-stone-500 uppercase tracking-widest">At your service</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-6 mb-6 custom-scrollbar">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-sm' 
                    : 'bg-surface-container-high text-on-surface rounded-tl-sm'
                }`}>
                  <p className="font-body leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.items && msg.items.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <p className="text-xs font-label uppercase tracking-widest opacity-70 mb-2">Recommended for you:</p>
                      {msg.items.map(item => (
                        <div key={item.id} className="bg-surface-container-lowest rounded-xl p-3 flex gap-4 items-center border border-outline-variant/20">
                          <img src={item.image_url || item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <h4 className="font-headline text-primary text-lg">{item.name}</h4>
                            <p className="text-sm text-stone-500">${((item as any).price || (item as any).price_glass || 0).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-secondary text-on-secondary p-2 rounded-full hover:scale-105 transition-transform"
                            aria-label="Add to cart"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-surface-container-high rounded-2xl rounded-tl-sm p-5 flex items-center gap-3">
                  <Loader2 className="animate-spin text-primary" size={20} />
                  <span className="font-body text-stone-500">Consulting the cellar...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit();
                }
              }}
              placeholder="Ask for a pairing, describe your taste, or request a recommendation..."
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-full py-4 pl-6 pr-16 font-body text-primary placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isThinking}
            />
            <button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim() || isThinking}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary p-2.5 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Wine Grid */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[0.75rem] font-label tracking-[0.25rem] uppercase text-secondary mb-3 block">Curated List</span>
            <h2 className="text-4xl md:text-5xl font-headline text-primary">The Wine List</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {['All', 'Red Wine', 'White Wine', 'Rosé', 'Sparkling'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-8 py-2.5 rounded-full font-label text-[0.7rem] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
                  filter === cat ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-highest text-primary hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {filteredItems.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group flex flex-col sm:flex-row gap-8 items-center sm:items-start"
            >
              <div className="w-full sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl relative shrink-0">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                {item.badge && (
                  <div className="absolute top-4 left-4 bg-secondary text-on-secondary text-[0.6rem] font-label uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    {item.badge}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col justify-between h-full py-2 text-center sm:text-left">
                <div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                    {item.tags?.map(tag => (
                      <span key={tag} className="text-[0.6rem] font-label text-stone-400 uppercase tracking-widest border border-stone-200 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-headline text-primary mb-3">{item.name}</h3>
                  <p className="text-on-surface-variant font-body leading-relaxed mb-6 max-w-sm">
                    {item.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Size Selection */}
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <button
                      onClick={() => setSelectedSizes(prev => ({ ...prev, [item.id]: 'glass' }))}
                      className={`px-4 py-2 rounded-lg font-label text-xs uppercase tracking-wider transition-all ${
                        (selectedSizes[item.id] || 'glass') === 'glass'
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      Glass
                    </button>
                    <button
                      onClick={() => setSelectedSizes(prev => ({ ...prev, [item.id]: 'bottle' }))}
                      className={`px-4 py-2 rounded-lg font-label text-xs uppercase tracking-wider transition-all ${
                        selectedSizes[item.id] === 'bottle'
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      Bottle
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-8">
                    <span className="text-2xl font-headline italic text-primary">
                      ${(selectedSizes[item.id] === 'bottle' 
                        ? rawWines.find(w => w.id === item.id)?.price_bottle 
                        : rawWines.find(w => w.id === item.id)?.price_glass || item.price).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-label text-[0.7rem] uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      Add to Ritual
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
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
    </div>
  );
}
