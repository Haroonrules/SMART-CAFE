import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

export function AdminInsightsScreen() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="text-orange-600" size={32} />
          AI-Powered Business Insights
        </h1>
        <p className="text-gray-500 mt-2">
          Leverage Large Language Models to analyze your cafe's performance and get actionable recommendations.
        </p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-orange-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-700 leading-relaxed">
              This feature will integrate with Groq API (Llama 3.1-8b-instant) to provide:
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Automated analysis of order patterns and peak hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Natural language business recommendations with priority levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Inventory alerts based on usage trends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Customer behavior insights and revenue predictions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Technical Architecture</h3>
        </div>
        <div className="prose prose-sm text-gray-600">
          <p>
            The Concierge Insights system uses LLMs instead of traditional ML models because:
          </p>
          <ul className="mt-2 space-y-1">
            <li>No extensive training data required - works with small datasets</li>
            <li>Natural language output that administrators can understand</li>
            <li>Rapid deployment with zero model training time</li>
            <li>Cost-effective (~$0.05-0.10 per analysis)</li>
            <li>Reuses existing AI infrastructure (Groq API integration)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
