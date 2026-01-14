import React, { useEffect, useState } from 'react';
import { Users, DollarSign, ShoppingBag, Activity, TrendingUp, ArrowUpRight, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { getDashboardMetrics } from '../services/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import Layout from '../components/Layout';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({ title, value, icon: Icon, gradient, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
        </div>
    </div>
);

const DistributionChart = ({ data, title, dataKey = "count", color = "#8884d8" }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const metrics = await getDashboardMetrics();
                setData(metrics);
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

    // If data is empty, we just show zeros, no need for a blocking "Go to Upload" if the user wants to see the dashboard structure.
    // However, showing all zeros might be confusing without finding out why.
    // The user explicitly said "Dashboard is only for showing dashboard".

    // Let's keep the isDataEmpty check but make it subtler or just allow rendering with zeros.
    // We already handle empty arrays in charts gracefully usually (recharts).

    // Actually, let's just let it render. The KPIs will be 0.
    // The charts will be empty.

    // Pass through if data exists (stats can be 0).

    const { kpi, sales_trend, category_share, rfm_dist } = data;

    return (
        <Layout>
            <div className="space-y-8 pb-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
                    <p className="text-gray-500">Real-time overview of your customer data and performance.</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Customers"
                        value={kpi?.total_customers.toLocaleString() || 0}
                        icon={Users}
                        gradient="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`$${(kpi?.total_revenue || 0).toLocaleString()}`}
                        icon={DollarSign}
                        gradient="from-emerald-500 to-teal-600"
                    />
                    <StatCard
                        title="Avg Order Value"
                        value={`$${Math.round(kpi?.avg_order_value || 0).toLocaleString()}`}
                        icon={ShoppingBag}
                        gradient="from-violet-500 to-purple-600"
                    />
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sales Trend */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Trend</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sales_trend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="amount" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Share */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Product Categories</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={category_share}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {category_share.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* RFM Distribution Section */}
                {rfm_dist && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Customer Distributions (RFM)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DistributionChart
                                data={rfm_dist.recency}
                                title="Recency (Days)"
                                color="#8884d8"
                            />
                            <DistributionChart
                                data={rfm_dist.frequency}
                                title="Frequency (Orders)"
                                color="#82ca9d"
                            />
                            <DistributionChart
                                data={rfm_dist.monetary}
                                title="Monetary (Spend)"
                                color="#EF4444"
                            />
                        </div>
                    </div>
                )}

                {/* Next Step CTA */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Ready to take action?</h3>
                        <p className="text-indigo-100">View strategic recommendations based on your customer segments.</p>
                    </div>
                    <a
                        href="/strategy"
                        className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center"
                    >
                        View Strategies
                        <ArrowUpRight className="w-5 h-5 ml-2" />
                    </a>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;
