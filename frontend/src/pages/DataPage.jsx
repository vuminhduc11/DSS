import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getDataQuality, createTransaction, processRLFM } from '../services/api';
import Layout from '../components/Layout';
import {
    Database, Table, Activity, Plus, Upload, Search,
    ChevronLeft, ChevronRight, FileText, CheckCircle, AlertTriangle, Loader, PieChart
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const DataPage = () => {
    const [activeTab, setActiveTab] = useState('explorer'); // 'operations', 'explorer', 'quality', 'analytics'
    const [loading, setLoading] = useState(false);

    // Explorer State
    const [transactions, setTransactions] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 50;

    // Quality State
    const [stats, setStats] = useState(null);

    // Operations State
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        customer_code: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: '',
        product_category: ''
    });

    // Analytics State
    const [chartConfig, setChartConfig] = useState({ type: 'bar', xAxis: 'date', yAxis: 'amount' });
    const [chartData, setChartData] = useState([]);

    // --- Effects ---
    useEffect(() => {
        if (activeTab === 'explorer') fetchTransactions();
        if (activeTab === 'quality') fetchQuality();
    }, [activeTab, page]);

    // --- API Calls ---
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await getTransactions((page - 1) * limit, limit);
            setTransactions(res.items);
            setTotalItems(res.total);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuality = async () => {
        setLoading(true);
        try {
            const data = await getDataQuality();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await createTransaction({
                ...formData,
                amount: parseFloat(formData.amount)
            });
            setMessage({ type: 'success', text: 'Transaction added successfully!' });
            setFormData({ ...formData, amount: '', customer_code: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to add' });
        } finally {
            setFormLoading(false);
        }
    };

    const handleRLFM = async () => {
        setFormLoading(true);
        try {
            const res = await processRLFM();
            setMessage({ type: 'success', text: `Processed ${res} customer records into RLFM features!` });
        } catch (err) {
            setMessage({ type: 'error', text: 'RLFM Calculation Failed' });
        } finally {
            setFormLoading(false);
        }
    };

    const handlePlot = () => {
        // Simple client-side plotting based on loaded transactions (for demo)
        // In real app, this should hit an aggregation API
        let data = [...transactions];

        // Grouping logic based on selection
        if (chartConfig.xAxis === 'category') {
            const grouped = {};
            data.forEach(t => {
                const key = t.category || 'Unknown';
                grouped[key] = (grouped[key] || 0) + (chartConfig.yAxis === 'count' ? 1 : t.amount);
            });
            setChartData(Object.keys(grouped).map(k => ({ name: k, value: grouped[k] })));
        } else {
            // Date logic
            setChartData(data.slice(0, 50).map(t => ({
                name: new Date(t.date).toLocaleDateString(),
                value: t.amount
            })).reverse());
        }
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(totalItems / limit);
        return (
            <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-gray-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems}
                </span>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header & Tabs */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Data Hub</h1>
                    <div className="flex space-x-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('explorer')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'explorer' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center"><Table className="w-4 h-4 mr-2" /> Data Explorer</div>
                            {activeTab === 'explorer' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('operations')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'operations' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center"><Database className="w-4 h-4 mr-2" /> Operations</div>
                            {activeTab === 'operations' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('quality')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'quality' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center"><Activity className="w-4 h-4 mr-2" /> Data Statistics</div>
                            {activeTab === 'quality' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center"><PieChart className="w-4 h-4 mr-2" /> Custom Analytics</div>
                            {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">

                    {/* EXPLORER TAB */}
                    {activeTab === 'explorer' && (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-700">Raw Transactions</h3>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input placeholder="Search ID..." className="pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Txn Code</th>
                                            <th className="px-6 py-3">Customer</th>
                                            <th className="px-6 py-3">Category</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr><td colSpan="5" className="p-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                        ) : transactions.map(t => (
                                            <tr key={t.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-3 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-3 font-mono text-xs text-gray-500">{t.code}</td>
                                                <td className="px-6 py-3 font-medium text-gray-800">{t.customer_code}</td>
                                                <td className="px-6 py-3 text-gray-500">{t.category || '-'}</td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-800">${t.amount?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination()}
                        </div>
                    )}

                    {/* OPERATIONS TAB */}
                    {activeTab === 'operations' && (
                        <div className="p-8 overflow-y-auto">
                            <div className="max-w-5xl mx-auto">
                                {/* RLFM Transformation Card */}
                                <div className="mb-8 border rounded-xl p-6 bg-purple-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-purple-900">Feature Engineering</h3>
                                        <p className="text-sm text-gray-600">Transform raw transactions into Recency, Frequency, Monetary (RLFM) features for clustering.</p>
                                    </div>
                                    <button
                                        onClick={handleRLFM}
                                        disabled={formLoading}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                                    >
                                        <div className="flex items-center">
                                            <Activity className="w-5 h-5 mr-2" /> Calculate RLFM
                                        </div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Manual Entry */}
                                    <div className="border rounded-xl p-6 bg-blue-50/30">
                                        <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center">
                                            <Plus className="w-5 h-5 mr-2" /> Manual Entry
                                        </h3>
                                        {message.text && (
                                            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {message.text}
                                            </div>
                                        )}
                                        <form onSubmit={handleManualSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Customer *</label>
                                                    <input required className="w-full p-2 border rounded-lg" value={formData.customer_code} onChange={e => setFormData({ ...formData, customer_code: e.target.value })} placeholder="C001" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Date *</label>
                                                    <input required type="date" className="w-full p-2 border rounded-lg" value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Amount *</label>
                                                <input required type="number" step="0.01" className="w-full p-2 border rounded-lg" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                                            </div>
                                            <button disabled={formLoading} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
                                                {formLoading ? 'Adding...' : 'Add Transaction'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* File Upload */}
                                    <div className="border rounded-xl p-6 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                            <Upload className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800 mb-2">Bulk Import</h3>
                                        <p className="text-sm text-gray-500 mb-6">Drag and drop your Excel/CSV file here to process thousands of records at once.</p>
                                        <a href="/upload-workflow" className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                                            Start Import Wizard
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUALITY TAB */}
                    {activeTab === 'quality' && (
                        <div className="p-8 overflow-y-auto">
                            {loading || !stats ? (
                                <div className="py-20 text-center"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4">Overview</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-gray-500">Total Transactions</span>
                                                <span className="font-mono font-bold">{stats.total_transactions?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-gray-500">Total Customers</span>
                                                <span className="font-mono font-bold">{stats.total_customers?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-gray-500">Total Revenue</span>
                                                <span className="font-mono font-bold text-green-600">${stats.total_revenue?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <h4 className="font-bold text-gray-700 mb-4">Data Health</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-gray-500">Date Range</span>
                                                <span className="font-mono text-sm">{new Date(stats.date_range?.start).toLocaleDateString()} - {new Date(stats.date_range?.end).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-gray-500">Missing Categories</span>
                                                <span className="font-mono text-amber-600 font-bold">{stats.missing_values?.product_category || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div className="p-6 h-full flex flex-col">
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl flex gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">X Axis</label>
                                    <select className="p-2 border rounded-lg w-40" value={chartConfig.xAxis} onChange={e => setChartConfig({ ...chartConfig, xAxis: e.target.value })}>
                                        <option value="date">Transaction Date</option>
                                        <option value="category">Category</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Y Axis</label>
                                    <select className="p-2 border rounded-lg w-40" value={chartConfig.yAxis} onChange={e => setChartConfig({ ...chartConfig, yAxis: e.target.value })}>
                                        <option value="amount">Amount ($)</option>
                                        <option value="count">Count</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                                    <select className="p-2 border rounded-lg w-40" value={chartConfig.type} onChange={e => setChartConfig({ ...chartConfig, type: e.target.value })}>
                                        <option value="bar">Bar Chart</option>
                                        <option value="line">Line Chart</option>
                                        <option value="area">Area Chart</option>
                                    </select>
                                </div>
                                <button onClick={handlePlot} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Plot</button>
                            </div>

                            <div className="flex-1 bg-white border rounded-xl p-4 relative">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartConfig.type === 'line' ? (
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                                            </LineChart>
                                        ) : (
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        Click "Plot" to visualize data
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default DataPage;
