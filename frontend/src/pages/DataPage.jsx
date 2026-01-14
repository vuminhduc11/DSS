import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getDataQuality, createTransaction, processRLFM, createInteraction, getCustomerInteractions } from '../services/api';
import Layout from '../components/Layout';
import {
    Database, Table, Activity, Plus, Upload, Search,
    ChevronLeft, ChevronRight, FileText, CheckCircle, AlertTriangle, Loader, PieChart, MessageSquare, User, Send
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const DataPage = () => {
    const { user } = useAuth();
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

    // Interactions State
    const [interactionCustomerId, setInteractionCustomerId] = useState('');
    const [customerInteractions, setCustomerInteractions] = useState([]);

    const [interactionForm, setInteractionForm] = useState({
        channel: 'Hotline',
        content: '',
        sentiment: 'Neutral'
    });

    const location = useLocation();

    // --- Effects ---
    useEffect(() => {
        if (user) {
            // Determine default tab if current default 'explorer' is not allowed
            if (user.role === 'retail_system' && activeTab === 'explorer') {
                setActiveTab('operations');
            } else if (user.role === 'staff' && activeTab === 'explorer') {
                // Staff CAN see explorer, so this is fine. Default is explorer.
            }
        }
    }, [user]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tabParam = queryParams.get('tab');
        const customerIdParam = queryParams.get('customerId');

        if (tabParam) {
            setActiveTab(tabParam);
        }
        if (customerIdParam) {
            setInteractionCustomerId(customerIdParam);
            // Trigger search immediately if ID is present
            // We need to call the API directly here or set a flag to trigger effect
            // Simpler to just call the function but ensure it doesn't cause loop
            getCustomerInteractions(customerIdParam).then(data => {
                setCustomerInteractions(data);
            }).catch(console.error);
        }
    }, [location.search]);

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

    const handleSearchInteractions = async () => {
        if (!interactionCustomerId) return;
        setLoading(true);
        try {
            const data = await getCustomerInteractions(interactionCustomerId);
            setCustomerInteractions(data);
        } catch (err) {
            console.error(err);
            // Optionally show error that customer not found
        } finally {
            setLoading(false);
        }
    };

    const handleInteractionSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await createInteraction({
                customer_id: parseInt(interactionCustomerId), // Assuming ID is int, might need logic to lookup ID from Code
                ...interactionForm
            });
            // Refresh list
            handleSearchInteractions();
            setInteractionForm({ ...interactionForm, content: '' });
        } catch (err) {
            alert("Failed to log interaction. Ensure Customer ID is valid.");
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
            <div className="flex flex-col h-[calc(100vh-8rem)] space-y-6">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold heading-gradient">Data Hub</h1>
                        <p className="text-slate-500 mt-1">Manage, transform, and analyze your customer data assets.</p>
                    </div>

                    <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-xl border border-white/60 shadow-sm flex overflow-x-auto custom-scrollbar">
                        {['explorer', 'operations', 'quality', 'analytics', 'interactions'].map(tab => {
                            // Role-based visibility logic
                            if (!user) return null;
                            const role = user.role;
                            if (tab === 'operations' && role === 'staff') return null;
                            if (tab === 'interactions' && role === 'retail_system') return null;
                            if (tab === 'analytics' && role === 'retail_system') return null;
                            if (tab === 'quality' && role === 'retail_system') return null;
                            if (tab === 'explorer' && role === 'retail_system') return null;

                            // Define labels and icons
                            let label = '';
                            let Icon = Table;
                            if (tab === 'explorer') { label = 'Explorer'; Icon = Table; }
                            if (tab === 'operations') { label = 'Operations'; Icon = Database; }
                            if (tab === 'quality') { label = 'Quality'; Icon = Activity; }
                            if (tab === 'analytics') { label = 'Analytics'; Icon = PieChart; }
                            if (tab === 'interactions') { label = 'Interactions'; Icon = MessageSquare; }

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                            ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50 scale-100'
                                            : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 mr-2 ${activeTab === tab ? 'text-blue-500' : 'text-slate-400'}`} /> {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden glass-panel flex flex-col relative z-0">

                    {/* EXPLORER TAB */}
                    {activeTab === 'explorer' && (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/40 backdrop-blur-sm">
                                <h3 className="font-bold text-slate-700 flex items-center">
                                    <Table className="w-5 h-5 mr-2 text-indigo-500" />
                                    Raw Transactions
                                </h3>
                                <div className="relative group">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input placeholder="Search ID..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 bg-white/50 focus:bg-white transition-all" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 backdrop-blur-md z-10">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Txn Code</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white/30">
                                        {loading ? (
                                            <tr><td colSpan="5" className="p-20 text-center"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-500" /><p className="text-slate-400 mt-2">Loading data...</p></td></tr>
                                        ) : transactions.map((t, idx) => (
                                            <tr key={t.id || idx} className="table-row-hover group cursor-default">
                                                <td className="px-6 py-3.5 text-slate-600 font-medium">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-slate-400 group-hover:text-blue-500 transition-colors">{t.code}</td>
                                                <td className="px-6 py-3.5 font-semibold text-slate-700">
                                                    <span className="bg-indigo-50 text-indigo-700 py-1 px-2 rounded-md text-xs">{t.customer_code}</span>
                                                </td>
                                                <td className="px-6 py-3.5 text-slate-500">{t.category || '-'}</td>
                                                <td className="px-6 py-3.5 text-right font-bold text-slate-700 group-hover:text-green-600 transition-colors">${t.amount?.toFixed(2)}</td>
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
                        <div className="p-8 overflow-y-auto custom-scrollbar h-full">
                            <div className="max-w-5xl mx-auto space-y-8">
                                {/* RLFM Transformation Card */}
                                <div className="p-1 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/20">
                                    <div className="bg-white/95 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-800 flex items-center">
                                                <Activity className="w-6 h-6 mr-3 text-purple-600" />
                                                Feature Engineering Engine
                                            </h3>
                                            <p className="text-slate-500 mt-2 max-w-lg">
                                                Transform raw transaction logs into Recency, Length, Frequency, Monetary (RLFM) vectors required for advanced clustering algorithms.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRLFM}
                                            disabled={formLoading}
                                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center whitespace-nowrap"
                                        >
                                            {formLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Activity className="w-5 h-5 mr-2" />}
                                            Run RLFM Pipeline
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Manual Entry */}
                                    <div className="glass-card p-8">
                                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            Manual Transaction Entry
                                        </h3>
                                        {message.text && (
                                            <div className={`mb-6 p-4 rounded-xl text-sm flex items-center border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                                {message.text}
                                            </div>
                                        )}
                                        <form onSubmit={handleManualSubmit} className="space-y-5">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Code</label>
                                                    <input required className="input-field" value={formData.customer_code} onChange={e => setFormData({ ...formData, customer_code: e.target.value })} placeholder="e.g. C001" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                                                    <input required type="date" className="input-field" value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <input required type="number" step="0.01" className="input-field pl-8 font-mono" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                                                </div>
                                            </div>
                                            <button disabled={formLoading} className="w-full btn-primary-gradient py-3">
                                                {formLoading ? 'Processing...' : 'Add Transaction'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* File Upload */}
                                    <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="relative z-10 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200/50 group-hover:scale-110 transition-transform duration-300">
                                            <Upload className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="relative z-10 font-bold text-xl text-slate-800 mb-2">Bulk Data Import</h3>
                                        <p className="relative z-10 text-slate-500 mb-8 max-w-xs mx-auto text-sm">Upload Excel or CSV files to process thousands of records instantly using our optimized workflow.</p>
                                        <a href="/workflow" className="relative z-10 px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center group/btn">
                                            Start Import Wizard <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUALITY TAB */}
                    {activeTab === 'quality' && (
                        <div className="p-8 overflow-y-auto h-full">
                            {loading || !stats ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                                    <p>Analyzing Data Quality...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                    <div className="glass-card p-8">
                                        <div className="flex items-center mb-6">
                                            <div className="p-3 bg-blue-100 rounded-xl mr-4"><Database className="w-6 h-6 text-blue-600" /></div>
                                            <h4 className="font-bold text-xl text-slate-800">Dataset Overview</h4>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-3">
                                                <span className="text-slate-500 font-medium">Total Transactions</span>
                                                <span className="font-mono text-2xl font-bold text-slate-800">{stats.total_transactions?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-3">
                                                <span className="text-slate-500 font-medium">Unique Customers</span>
                                                <span className="font-mono text-2xl font-bold text-slate-800">{stats.total_customers?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-3">
                                                <span className="text-slate-500 font-medium">Total Revenue</span>
                                                <span className="font-mono text-2xl font-bold text-green-600">${stats.total_revenue?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card p-8">
                                        <div className="flex items-center mb-6">
                                            <div className="p-3 bg-amber-100 rounded-xl mr-4"><Activity className="w-6 h-6 text-amber-600" /></div>
                                            <h4 className="font-bold text-xl text-slate-800">Health Check</h4>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-3">
                                                <span className="text-slate-500 font-medium">Date Range</span>
                                                <div className="text-right">
                                                    <div className="font-medium text-slate-800">{new Date(stats.date_range?.start).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-400">to {new Date(stats.date_range?.end).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-3">
                                                <span className="text-slate-500 font-medium">Missing Categories</span>
                                                <span className="font-mono text-2xl font-bold text-amber-500">{stats.missing_values?.product_category || 0}</span>
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
                            <div className="mb-6 p-4 glass-card bg-white/60 flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">X Axis Dimension</label>
                                    <select className="input-field w-48" value={chartConfig.xAxis} onChange={e => setChartConfig({ ...chartConfig, xAxis: e.target.value })}>
                                        <option value="date">Transaction Date</option>
                                        <option value="category">Category</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Y Axis Metric</label>
                                    <select className="input-field w-48" value={chartConfig.yAxis} onChange={e => setChartConfig({ ...chartConfig, yAxis: e.target.value })}>
                                        <option value="amount">Amount ($)</option>
                                        <option value="count">Count (Volume)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visualization</label>
                                    <div className="flex bg-slate-100 rounded-lg p-1">
                                        {['bar', 'line', 'area'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setChartConfig({ ...chartConfig, type })}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${chartConfig.type === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handlePlot} className="btn-primary-gradient px-6 py-2.5 ml-auto">
                                    Generate Chart
                                </button>
                            </div>

                            <div className="flex-1 glass-card p-6 relative overflow-hidden">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartConfig.type === 'line' ? (
                                            <LineChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `$${value}`} />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                                />
                                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        ) : (
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                                <Bar dataKey="value" fill="url(#colorGradient)" radius={[6, 6, 0, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <PieChart className="w-16 h-16 mb-4 opacity-20" />
                                        <p>Select dimensions and click "Generate Chart" to visualize data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INTERACTIONS TAB */}
                    {activeTab === 'interactions' && (
                        <div className="flex h-full">
                            {/* Left: Search & List */}
                            <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
                                <div className="p-6 border-b border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Customer Lookup</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="Enter Customer ID..."
                                                value={interactionCustomerId}
                                                onChange={e => setInteractionCustomerId(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSearchInteractions}
                                            className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {loading ? (
                                        <div className="text-center py-10"><Loader className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>
                                    ) : customerInteractions.length === 0 ? (
                                        <div className="text-center text-slate-400 text-sm py-10 px-4">
                                            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p>No interactions found. Search for a customer to view or log history.</p>
                                        </div>
                                    ) : (
                                        customerInteractions.map(i => (
                                            <div key={i.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${i.channel === 'Hotline' ? 'bg-red-50 text-red-600' :
                                                        i.channel === 'Email' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {i.channel}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">{new Date(i.interaction_date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed mb-3">{i.content}</p>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i.sentiment === 'Positive' ? 'bg-green-500' :
                                                        i.sentiment === 'Negative' ? 'bg-red-500' : 'bg-slate-400'
                                                        }`}></div>
                                                    <span className="text-xs font-medium text-slate-500">{i.sentiment}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Add New */}
                            <div className="flex-1 p-8 flex flex-col bg-white/40">
                                <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                    </div>
                                    Log New Interaction
                                </h3>

                                {interactionCustomerId ? (
                                    <form onSubmit={handleInteractionSubmit} className="space-y-6 max-w-lg">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Channel</label>
                                                <select
                                                    className="input-field"
                                                    value={interactionForm.channel}
                                                    onChange={e => setInteractionForm({ ...interactionForm, channel: e.target.value })}
                                                >
                                                    <option value="Hotline">Hotline</option>
                                                    <option value="Email">Email</option>
                                                    <option value="Social">Social Media</option>
                                                    <option value="Store">In-Store</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sentiment</label>
                                                <div className="flex gap-2">
                                                    {['Positive', 'Neutral', 'Negative'].map(s => (
                                                        <label key={s} className={`flex-1 flex items-center justify-center p-2 rounded-lg cursor-pointer border transition-all ${interactionForm.sentiment === s
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                            }`}>
                                                            <input
                                                                type="radio"
                                                                name="sentiment"
                                                                value={s}
                                                                checked={interactionForm.sentiment === s}
                                                                onChange={e => setInteractionForm({ ...interactionForm, sentiment: e.target.value })}
                                                                className="sr-only"
                                                            />
                                                            <span className="text-xs">{s}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                                            <textarea
                                                required
                                                rows="5"
                                                className="input-field resize-none leading-relaxed"
                                                placeholder="Describe the main points of interaction..."
                                                value={interactionForm.content}
                                                onChange={e => setInteractionForm({ ...interactionForm, content: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className="px-8 py-3 btn-primary-gradient w-full flex items-center justify-center"
                                        >
                                            {formLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                            Submit Interaction Log

                                        </button>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-center flex-1 text-gray-400 border-2 border-dashed rounded-xl">
                                        <p>Select a customer to log interaction</p>
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
