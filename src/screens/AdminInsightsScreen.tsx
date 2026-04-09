import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, Smile, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

interface Insights {
  sentiment: string;
  peakTime: string;
  insight: string;
}

export function AdminInsightsScreen() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Fetch orders and menu items from Firestore
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const menuSnapshot = await getDocs(collection(db, 'menu_items'));
      const menuItems = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setOrderCount(orders.length);
      setMenuCount(menuItems.length);

      // Call backend API to generate insights
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders,
          menuItems
        })
      });

      if (!response.ok) throw new Error('Failed to generate insights');

      const data = await response.json();
      setInsights(data);
      toast.success('AI insights generated successfully!');
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getSentimentColor = (sentiment: string) => {
    const lower = sentiment.toLowerCase();
    if (lower.includes('positive') || lower.includes('excellent') || lower.includes('great')) {
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    } else if (lower.includes('negative') || lower.includes('poor')) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  return (
    <main className="ml-64 p-10 bg-surface-container-lowest min-h-screen">
      <header className="flex justify-between items-end mb-12">
        <div>
          <span className="text-[0.75rem] font-label tracking-[0.2em] text-stone-400 uppercase mb-2 block">Business Intelligence</span>
          <h1 className="text-5xl font-headline text-primary">AI Analytics</h1>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw size={20} />
              Refresh Insights
            </>
          )}
        </button>
      </header>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Total Orders Analyzed</p>
              <p className="text-2xl font-headline text-primary font-bold">{orderCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Active Menu Items</p>
              <p className="text-2xl font-headline text-primary font-bold">{menuCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {loading && !insights ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Sentiment & Peak Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-8 border shadow-sm ${getSentimentColor(insights.sentiment)}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <Smile size={32} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Customer Sentiment</p>
                  <p className="text-3xl font-headline font-bold">{insights.sentiment}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 border border-stone-200/30 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Peak Hours</p>
                  <p className="text-3xl font-headline text-primary font-bold">{insights.peakTime}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-8 border border-primary/10 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Key Insight</p>
                <p className="text-lg font-body text-primary leading-relaxed">{insights.insight}</p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-stone-300 mb-4" size={48} />
          <p className="text-stone-400 font-label uppercase tracking-widest mb-4">No insights available</p>
          <button
            onClick={fetchInsights}
            className="text-primary hover:underline font-label text-sm uppercase tracking-widest"
          >
            Generate Insights
          </button>
        </div>
      )}
    </main>
  );
}
