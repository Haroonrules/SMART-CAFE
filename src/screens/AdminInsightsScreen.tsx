import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Clock, DollarSign, Target, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { auth } from '../firebase';
import { AIInsights } from '../types';

export function AdminInsightsScreen() {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      const token = await currentUser.getIdToken(true); // Force refresh
      
      const response = await fetch('/api/admin/insights', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err: any) {
      console.error('[INSIGHTS] Fetch error:', err);
      setError(err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchInsights();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={18} className="text-red-600" />;
      case 'medium':
        return <AlertCircle size={18} className="text-yellow-600" />;
      case 'low':
        return <Target size={18} className="text-blue-600" />;
      default:
        return <Target size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="animate-spin text-orange-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600 font-medium">AI is analyzing your cafe's performance...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-orange-600" size={32} />
            AI-Powered Business Insights
          </h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Insights</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchInsights}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <button
            onClick={fetchInsights}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
          >
            <TrendingUp size={20} />
            Generate AI Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-orange-600" size={32} />
            AI-Powered Business Insights
          </h1>
          <p className="text-gray-500 mt-2">
            Smart analytics powered by LLM analysis of your last 30 days of order data
          </p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh Analysis
        </button>
      </div>

      {/* Peak Hours & Revenue Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Peak Hours Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="text-purple-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Peak Hours Analysis</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{insights.peak_hours_analysis}</p>
        </div>

        {/* Revenue Prediction */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Revenue Forecast</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{insights.revenue_prediction}</p>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Target className="text-orange-600" size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Actionable Recommendations</h2>
        </div>

        <div className="space-y-4">
          {insights.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getPriorityColor(rec.priority)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                {getPriorityIcon(rec.priority)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                      rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Alerts */}
      {insights.inventory_alerts.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Package className="text-amber-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Inventory Alerts</h2>
          </div>

          <ul className="space-y-3">
            {insights.inventory_alerts.map((alert, index) => (
              <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-amber-200">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-gray-700">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
