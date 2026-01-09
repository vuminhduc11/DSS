import React, { useEffect, useState } from 'react';
import { Users, DollarSign, ShoppingBag, Activity, TrendingUp, ArrowUpRight } from 'lucide-react';
import { getSummaryStats, getSalesOverTime } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, gradient, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>

        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
                <Icon className="w-6 h-6" />
            </div>
            {trend && (
                <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {trend}
                </span>
            )}
        </div>

        <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
        </div>
    </div>
);

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, salesRes] = await Promise.all([
                    getSummaryStats(),
                    getSalesOverTime()
                ]);
                setStats(statsRes);
                setSalesData(salesRes);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                <p className="text-gray-500">Welcome back! Here's what's happening with your data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Customers"
                    value={stats?.total_customers || 0}
                    icon={Users}
                    gradient="from-blue-500 to-blue-600"
                    trend="+12%"
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${(stats?.total_revenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    gradient="from-emerald-500 to-teal-600"
                    trend="+8.2%"
                />
                <StatCard
                    title="Transactions"
                    value={stats?.total_transactions || 0}
                    icon={ShoppingBag}
                    gradient="from-violet-500 to-purple-600"
                />
                <StatCard
                    title="Active Runs"
                    value={stats?.recent_runs?.length || 0}
                    icon={Activity}
                    gradient="from-orange-500 to-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Revenue Trend</h3>
                        <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center">
                            View Report <ArrowUpRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short' })}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    labelFormatter={(str) => new Date(str).toLocaleDateString()}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {stats?.recent_runs?.length > 0 ? (
                            stats.recent_runs.map((run) => (
                                <div key={run.id} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {run.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 group-hover:text-blue-700">{run.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(run.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        Done
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No clustering runs yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
