import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHistory, deleteRun, getStrategy } from '../services/api';
import { Clock, Trash2, ChevronRight, FileText, Calendar, Users, Zap, Loader, PieChart, BarChart2 } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import Layout from '../components/Layout';

const HistoryPage = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState(null);
    const [strategies, setStrategies] = useState(null);
    const [stratLoading, setStratLoading] = useState(false);

    const fetchHistory = async () => {
        try {
            const data = await getHistory();
            setHistory(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this analysis run?")) return;

        try {
            await deleteRun(id);
            setHistory(history.filter(h => h.id !== id));
            if (selectedRun?.id === id) {
                setSelectedRun(null);
                setStrategies(null);
            }
        } catch (err) {
            alert("Failed to delete run");
        }
    };

    const [selectedCluster, setSelectedCluster] = useState(null);
    const [clusterCustomers, setClusterCustomers] = useState([]);
    const [custLoading, setCustLoading] = useState(false);

    // ... (keep handleSelectRun same, but clear selectedCluster)
    const handleSelectRun = async (run) => {
        setSelectedRun(run);
        setSelectedCluster(null); // Clear previous selection
        setClusterCustomers([]);
        setStratLoading(true);
        try {
            const data = await getStrategy(run.id);
            setStrategies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setStratLoading(false);
        }
    };

    const handleViewCustomers = async (clusterLabel) => {
        if (selectedCluster === clusterLabel) {
            setSelectedCluster(null); // Toggle off
            return;
        }
        setSelectedCluster(clusterLabel);
        setCustLoading(true);
        try {
            // We need an API function for this. Assuming generic fetch or we add it to api.js
            // Since we can't edit api.js easily without seeing it again, let's use a direct fetch or assume getClusterCustomers exists if we added it (we didn't yet).
            // Actually, strategy.py HAS the endpoint. We need to call it.
            // Let's implement a quick fetch here or use the one from api.js if it existed (it didn't appear in imports).
            // I'll assume we can import it if I added it, but I didn't. 
            // Let's use fetch directly for now or better, update api.js first? 
            // No, preventing context switch. I'll generic fetch it.
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/v1/strategy/${selectedRun.id}/cluster/${clusterLabel}/customers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClusterCustomers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCustLoading(false);
        }
    };

    const handleCareAction = (customerId) => {
        // Navigate to DataPage with interactions tab and customerId
        window.location.href = `/data?tab=interactions&customerId=${customerId}`;
    };

    // ... (Loading check)
    if (loading) return (
        <Layout>
            <div className="flex justify-center items-center h-96">
                <Loader className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="flex h-[calc(100vh-8rem)] gap-6">
                {/* List Column */}
                <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-bold text-gray-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-blue-600" /> Analysis History
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No history found</div>
                        ) : (
                            history.map(run => (
                                <div
                                    key={run.id}
                                    onClick={() => handleSelectRun(run)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all border ${selectedRun?.id === run.id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-semibold ${selectedRun?.id === run.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {run.run_name}
                                        </h3>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={(e) => handleDelete(e, run.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mb-2">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(run.created_at).toLocaleDateString()}
                                        <span className="mx-2">•</span>
                                        <span className="uppercase bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                            {run.algorithm}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-blue-600 font-medium">
                                        <Users className="w-3 h-3 mr-1" />
                                        {run.customer_count} Customers
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Column */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {selectedRun ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{selectedRun.run_name}</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Algorithm: <span className="font-medium text-gray-700">{selectedRun.algorithm}</span>
                                        <span className="mx-2">•</span>
                                        Run ID: #{selectedRun.id}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-600">Parameters</p>
                                    <div className="text-xs text-gray-500 max-w-xs truncate">
                                        {JSON.stringify(selectedRun.parameters)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                                {stratLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                ) : strategies ? (
                                    <div className="space-y-6">
                                        {/* Charts Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Distribution Chart */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-64">
                                                <h4 className="font-bold text-gray-700 mb-2 text-sm flex items-center">
                                                    <PieChart className="w-4 h-4 mr-1" /> Cluster Distribution
                                                </h4>
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <RechartsPie>
                                                        <Pie
                                                            data={strategies.map(s => ({ name: `Cluster ${s.cluster}`, value: s.customer_count }))}
                                                            cx="50%" cy="50%"
                                                            innerRadius={40} outerRadius={60}
                                                            dataKey="value"
                                                            paddingAngle={5}
                                                        >
                                                            {strategies.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </RechartsPie>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Spend Chart */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-64">
                                                <h4 className="font-bold text-gray-700 mb-2 text-sm flex items-center">
                                                    <BarChart2 className="w-4 h-4 mr-1" /> Average Spend
                                                </h4>
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <BarChart data={strategies.map(s => ({ name: `C${s.cluster}`, amount: s.avg_spend }))}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                        <YAxis tick={{ fontSize: 12 }} />
                                                        <Tooltip formatter={(value) => `$${value?.toFixed(0)}`} />
                                                        <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {strategies.map((strat, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                                                {strat.segment_name}
                                                            </h4>
                                                            <p className="text-sm text-gray-500 ml-5">Cluster {strat.cluster}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                                                {strat.customer_count} Customers
                                                            </span>
                                                            <button
                                                                onClick={() => handleViewCustomers(strat.cluster)}
                                                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium transition-colors"
                                                            >
                                                                {selectedCluster === strat.cluster ? 'Hide List' : 'View Customers'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <span className="block text-gray-400 text-xs uppercase mb-1">Avg Spend</span>
                                                            <span className="font-bold text-gray-700">${strat.avg_spend?.toFixed(2)}</span>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <span className="block text-gray-400 text-xs uppercase mb-1">Frequency</span>
                                                            <span className="font-bold text-gray-700">{strat.avg_frequency?.toFixed(1)}</span>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <span className="block text-gray-400 text-xs uppercase mb-1">Recency</span>
                                                            <span className="font-bold text-gray-700">{strat.avg_recency?.toFixed(0)} days</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-4">
                                                        <div className="flex items-center text-sm font-bold text-amber-800 mb-2">
                                                            <Zap className="w-4 h-4 mr-2" /> Recommended Strategy
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {strat.strategy || strat.strategies?.[0]}
                                                        </p>
                                                    </div>

                                                    {/* Customer List Table */}
                                                    {selectedCluster === strat.cluster && (
                                                        <div className="mt-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">
                                                            <h5 className="font-bold text-gray-700 mb-3 text-sm">Customer List ({clusterCustomers.length})</h5>
                                                            {custLoading ? (
                                                                <div className="text-center py-4"><Loader className="w-5 h-5 animate-spin mx-auto text-blue-500" /></div>
                                                            ) : (
                                                                <div className="overflow-x-auto max-h-60 border rounded-lg">
                                                                    <table className="w-full text-xs text-left">
                                                                        <thead className="bg-gray-50 sticky top-0">
                                                                            <tr>
                                                                                <th className="p-2 border-b">ID</th>
                                                                                <th className="p-2 border-b">Code</th>
                                                                                <th className="p-2 border-b">Name</th>
                                                                                <th className="p-2 border-b text-right">Spend</th>
                                                                                <th className="p-2 border-b text-center">Action</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {clusterCustomers.map(c => (
                                                                                <tr key={c.id} className="hover:bg-gray-50 divide-y divide-gray-50">
                                                                                    <td className="p-2 border-b">{c.id}</td>
                                                                                    <td className="p-2 border-b font-mono text-gray-500">{c.code}</td>
                                                                                    <td className="p-2 border-b font-medium">{c.name}</td>
                                                                                    <td className="p-2 border-b text-right">${c.total_spend?.toFixed(2)}</td>
                                                                                    <td className="p-2 border-b text-center">
                                                                                        <button
                                                                                            onClick={() => handleCareAction(c.id)}
                                                                                            className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                                                                                        >
                                                                                            CARE
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        No strategy details available for this run.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">Select an analysis run to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout >
    );
};

export default HistoryPage;
