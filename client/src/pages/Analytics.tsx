import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Target, Leaf } from 'lucide-react';
import { getScanHistory } from '@/lib/scanHistory';
import { calculateDashboardMetrics, calculateSustainabilityImprovement, getTopCategories, type ScanHistoryItem } from '@/lib/dashboardAnalytics';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];
const GRADE_COLORS: Record<string, string> = {
  'A': '#10b981',
  'B': '#84cc16',
  'C': '#f59e0b',
  'D': '#f97316',
  'E': '#ef4444',
};

export default function Analytics() {
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<ReturnType<typeof calculateDashboardMetrics> | null>(null);
  const [improvement, setImprovement] = useState<ReturnType<typeof calculateSustainabilityImprovement> | null>(null);

  useEffect(() => {
    const history = getScanHistory();
    setScanHistory(history);
    
    const calculatedMetrics = calculateDashboardMetrics(history);
    setMetrics(calculatedMetrics);
    
    const improvementData = calculateSustainabilityImprovement(history);
    setImprovement(improvementData);
  }, []);

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 mb-8">Loading your sustainability data...</p>
        </div>
      </div>
    );
  }

  if (metrics.totalScans === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <Card className="p-12 text-center">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No scan history yet. Start scanning products to see your sustainability analytics!</p>
          </Card>
        </div>
      </div>
    );
  }

  const topCategories = getTopCategories(metrics, 5);
  const gradeData = Object.entries(metrics.gradeDistribution).map(([grade, count]) => ({
    name: `Grade ${grade}`,
    value: count,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 mb-8">Track your sustainability journey and eco-conscious shopping habits</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalScans}</p>
              </div>
              <Target className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Eco-Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.averageEcoScore}</p>
              </div>
              <Award className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Best Score</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{metrics.bestEcoScore}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Improvement</p>
                <p className={`text-3xl font-bold mt-2 ${improvement && improvement.improvement > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {improvement?.improvement ?? 0}
                </p>
              </div>
              <Leaf className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Eco-Score Trend */}
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Eco-Score Trend</h2>
            {metrics.ecoScoreTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.ecoScoreTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    formatter={(value) => [`${value}`, 'Avg Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageScore" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No trend data available</p>
            )}
          </Card>

          {/* Grade Distribution */}
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} products`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No grade data available</p>
            )}
          </Card>
        </div>

        {/* Top Categories */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Scanned Categories</h2>
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    formatter={(value) => [value, 'Count']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </Card>

          {/* Category Details */}
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Eco-Scores</h2>
            <div className="space-y-3">
              {topCategories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cat.category}</p>
                    <p className="text-sm text-gray-600">{cat.count} products scanned</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{cat.averageEcoScore}</p>
                    <p className="text-xs text-gray-500">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sustainability Improvement */}
        {improvement && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Sustainability Journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-600 text-sm font-medium">Earlier Average</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{improvement.olderAverage}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className={`text-2xl font-bold ${improvement.improvement > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {improvement.improvement > 0 ? '+' : ''}{improvement.improvement}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">improvement</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Recent Average</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{improvement.recentAverage}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
