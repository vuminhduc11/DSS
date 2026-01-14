import React, { useState, useEffect } from 'react';
import { processRLFM, getRLFMData } from '../services/api';
import Layout from '../components/Layout';
import { Play, Loader, RefreshCw, AlertCircle, TrendingUp, Clock, DollarSign, BarChart3, Target, Zap } from 'lucide-react';

const RLFMPage = () => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const limit = 50;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getRLFMData(page * limit, limit);
            setData(res.data);
            setTotal(res.total);
            setError(null);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page]);

    const handleProcess = async () => {
        setProcessing(true);
        setError(null);
        try {
            const res = await processRLFM();
            alert(`Successfully processed. ${res.count} records updated.`);
            setPage(0);
            fetchData();
        } catch (err) {
            setError('Processing failed. Ensure data is uploaded.');
        } finally {
            setProcessing(false);
        }
    };

    // Calculate statistics
    const stats = data.length > 0 ? {
        avgRecency: (data.reduce((sum, d) => sum + d.recency, 0) / data.length).toFixed(1),
        avgFrequency: (data.reduce((sum, d) => sum + d.frequency, 0) / data.length).toFixed(1),
        avgMonetary: (data.reduce((sum, d) => sum + d.monetary, 0) / data.length).toFixed(0),
        avgLength: (data.reduce((sum, d) => sum + d.length, 0) / data.length).toFixed(1),
        avgVariety: (data.reduce((sum, d) => sum + d.variety, 0) / data.length).toFixed(1)
    } : null;

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold heading-gradient">RLFM Feature Matrix</h1>
                        <p className="text-slate-500 mt-1">Engineered customer behavior vectors for predictive analytics</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-3 btn-secondary-glass group disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                        <button
                            onClick={handleProcess}
                            disabled={processing}
                            className="btn-primary-gradient px-6 py-3 flex items-center disabled:opacity-50 disabled:transform-none"
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin mr-2" />
                                    Processing Pipeline...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 mr-2" />
                                    Run RLFM Engine
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="p-5 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 shadow-sm">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="glass-card p-5 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{stats.avgRecency}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Recency (days)</div>
                        </div>

                        <div className="glass-card p-5 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{stats.avgLength}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Length (days)</div>
                        </div>

                        <div className="glass-card p-5 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{stats.avgFrequency}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Frequency</div>
                        </div>

                        <div className="glass-card p-5 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">${stats.avgMonetary}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Monetary</div>
                        </div>

                        <div className="glass-card p-5 group hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Target className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{stats.avgVariety}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Variety</div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="glass-panel overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-white/40 backdrop-blur-sm">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center">
                            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            Customer Feature Vectors ({total.toLocaleString()} records)
                        </h3>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-right">Recency</th>
                                    <th className="px-6 py-4 text-right">Length</th>
                                    <th className="px-6 py-4 text-right">Frequency</th>
                                    <th className="px-6 py-4 text-right">Monetary</th>
                                    <th className="px-6 py-4 text-right">Variety</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white/30">
                                {loading && data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20">
                                            <Loader className="w-10 h-10 animate-spin mx-auto text-blue-500 mb-3" />
                                            <p className="text-slate-400">Loading feature data...</p>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20">
                                            <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-400 font-medium">No RLFM data available</p>
                                            <p className="text-slate-400 text-sm mt-2">Upload transaction data and run the RLFM engine to generate features</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, idx) => (
                                        <tr key={item.id || idx} className="table-row-hover group">
                                            <td className="px-6 py-4">
                                                <span className="bg-indigo-50 text-indigo-700 py-1 px-3 rounded-lg text-xs font-semibold">
                                                    {item.customer_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{item.recency.toFixed(0)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{item.length.toFixed(0)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{item.frequency.toFixed(0)}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-green-600">${item.monetary.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">{item.variety.toFixed(0)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {total > 0 && (
                        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-white/40">
                            <span className="text-sm text-slate-500 font-medium">
                                Showing <span className="font-bold text-slate-700">{Math.min(total, page * limit + 1)}</span> - <span className="font-bold text-slate-700">{Math.min(total, (page + 1) * limit)}</span> of <span className="font-bold text-slate-700">{total.toLocaleString()}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-all font-medium text-sm text-slate-600"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={(page + 1) * limit >= total}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-all font-medium text-sm text-slate-600"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default RLFMPage;
