/**
 * StatisticsDashboard Component
 *
 * Admin dashboard component for visualizing pre-aggregated statistics
 * using Recharts. Displays best sellers, category distribution, and trends.
 */

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  useStatistics,
  useStatisticsTrend,
  useStatisticsSummary,
} from "../hooks/useStatistics";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Award,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

/**
 * Summary Cards Component
 */
const SummaryCards: React.FC<{
  summary: {
    todayTurnover: number;
    todayOrders: number;
    weekTurnover: number;
    weekOrders: number;
    monthTurnover: number;
    monthOrders: number;
    avgOrderValue: number;
  };
  loading: boolean;
}> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Turnover",
      value: `$${summary.todayTurnover.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Today's Orders",
      value: summary.todayOrders.toString(),
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Avg Order Value",
      value: `$${summary.avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Week Turnover",
      value: `$${summary.weekTurnover.toFixed(2)}`,
      icon: Calendar,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow p-6 flex items-center space-x-4"
        >
          <div className={`${card.color} p-3 rounded-full`}>
            <card.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Best Sellers Chart Component
 */
const BestSellersChart: React.FC<{
  data: { name: string; count: number; revenue: number }[];
  loading: boolean;
}> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Best Sellers</h3>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Best Sellers</h3>
        <p className="text-gray-500 text-center py-8">
          No sales data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-500" />
          Best Sellers (by quantity)
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, "dataMax"]} />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "count" ? `${value} sold` : `$${value.toFixed(2)}`,
              name === "count" ? "Quantity" : "Revenue",
            ]}
          />
          <Legend />
          <Bar
            dataKey="count"
            fill="#3B82F6"
            name="Quantity Sold"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Category Distribution Chart Component
 */
const CategoryDistributionChart: React.FC<{
  data: { category: string; count: number; revenue: number }[];
  loading: boolean;
}> = ({ data, loading }) => {
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
        <p className="text-gray-500 text-center py-8">
          No category data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <PieChartIcon className="h-5 w-5 mr-2 text-green-500" />
          Sales by Category
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percent }) =>
              `${category} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} sold`,
              props.payload.category,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Trend Chart Component
 */
const TrendChart: React.FC<{
  data: { date: string; turnover: number; orders: number }[];
  loading: boolean;
}> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">7-Day Trend</h3>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
          7-Day Sales Trend
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
          <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "turnover" ? `$${value.toFixed(2)}` : `${value} orders`,
              name === "turnover" ? "Turnover" : "Orders",
            ]}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="turnover"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorTurnover)"
            name="Turnover ($)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            stroke="#10B981"
            strokeWidth={2}
            name="Orders"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Main Statistics Dashboard Component
 */
const StatisticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");

  const {
    statistics,
    loading: statsLoading,
    error: statsError,
    bestSellersChartData,
    categoryChartData,
    refresh,
  } = useStatistics(period, new Date(), false); // Disabled real-time to avoid Firebase SDK internal assertion errors

  const {
    trendData,
    loading: trendLoading,
    error: trendError,
  } = useStatisticsTrend(7);

  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
  } = useStatisticsSummary();

  const error = statsError || trendError || summaryError;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Statistics Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time sales analytics and insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === "daily"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === "monthly"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={refresh}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error loading statistics</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards summary={summary} loading={summaryLoading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Best Sellers Chart */}
          <BestSellersChart
            data={bestSellersChartData}
            loading={statsLoading}
          />

          {/* Category Distribution */}
          <CategoryDistributionChart
            data={categoryChartData}
            loading={statsLoading}
          />
        </div>

        {/* Trend Chart (Full Width) */}
        <TrendChart data={trendData} loading={trendLoading} />

        {/* Detailed Stats Table */}
        {statistics && statistics.bestSellers.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Detailed Sales Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units Sold
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics.bestSellers.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                                ? "bg-gray-100 text-gray-800"
                                : index === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ${item.revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        $
                        {item.count > 0
                          ? (item.revenue / item.count).toFixed(2)
                          : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Data is automatically aggregated when orders are placed. Last
            updated: {statistics?.lastUpdated?.toLocaleString() || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
