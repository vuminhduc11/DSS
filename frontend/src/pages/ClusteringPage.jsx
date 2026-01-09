import React, { useState } from 'react';
import { Play, Settings, BarChart2, Cpu, Sliders } from 'lucide-react';
import { runClustering } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ClusteringPage = () => {
    const [algorithm, setAlgorithm] = useState('kmeans');
    const [params, setParams] = useState({ n_clusters: 3, eps: 0.5, min_samples: 5 });
    const [runName, setRunName] = useState(`Run_${new Date().toISOString().split('T')[0]}`);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await runClustering(algorithm, params, runName);
            setResult(res);
        } catch (err) {
            setError(err.response?.data?.detail || 'Clustering failed');
        } finally {
            setLoading(false);
        }
    };

    const renderChart = () => {
        if (!result) return null;
        const data = Object.keys(result.counts).map(k => ({
            name: `Cluster ${k}`,
            count: result.counts[k]
        }));

        return (
            <div className="h-72 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Clustering Analysis</h2>
                    <p className="text-gray-500">Segment your customers using advanced ML algorithms</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600">
                                <Sliders className="w-5 h-5" />
                            </div>
                            Configuration
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</label>
                                <div className="relative">
                                    <select
                                        value={algorithm}
                                        onChange={(e) => setAlgorithm(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-gray-50"
                                    >
                                        <option value="kmeans">K-Means Clustering</option>
                                        <option value="dbscan">DBSCAN</option>
                                        <option value="hierarchical">Hierarchical Clustering</option>
                                        <option value="gmm">Gaussian Mixture Model</option>
                                        <option value="spectral">Spectral Clustering</option>
                                        <option value="birch">Birch Clustering</option>
                                        <option value="meanshift">Mean Shift</option>
                                        <option value="affinity_propagation">Affinity Propagation</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                        <Cpu className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Run Name</label>
                                <input
                                    type="text"
                                    value={runName}
                                    onChange={(e) => setRunName(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                />
                            </div>

                            {['kmeans', 'hierarchical', 'gmm', 'spectral', 'birch'].includes(algorithm) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Clusters</label>
                                    <input
                                        type="number"
                                        value={params.n_clusters}
                                        onChange={(e) => setParams({ ...params, n_clusters: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                    />
                                </div>
                            )}

                            {algorithm === 'dbscan' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Epsilon</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={params.eps}
                                            onChange={(e) => setParams({ ...params, eps: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Samples</label>
                                        <input
                                            type="number"
                                            value={params.min_samples}
                                            onChange={(e) => setParams({ ...params, min_samples: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {algorithm === 'spectral' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Affinity</label>
                                    <select
                                        value={params.affinity || 'rbf'}
                                        onChange={(e) => setParams({ ...params, affinity: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                    >
                                        <option value="rbf">RBF</option>
                                        <option value="nearest_neighbors">Nearest Neighbors</option>
                                    </select>
                                </div>
                            )}

                            {algorithm === 'birch' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Threshold</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={params.threshold || 0.5}
                                        onChange={(e) => setParams({ ...params, threshold: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                    />
                                </div>
                            )}

                            {algorithm === 'meanshift' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bandwidth (Optional)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Auto"
                                        value={params.bandwidth || ''}
                                        onChange={(e) => setParams({ ...params, bandwidth: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                    />
                                </div>
                            )}

                            {algorithm === 'affinity_propagation' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Damping (0.5 - 1.0)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.5"
                                        max="1.0"
                                        value={params.damping || 0.5}
                                        onChange={(e) => setParams({ ...params, damping: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleRun}
                                disabled={loading}
                                className={`w-full py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30'
                                    }`}
                            >
                                {loading ? (
                                    <>Running...</>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Run Analysis
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg mr-3 text-purple-600">
                                        <BarChart2 className="w-5 h-5" />
                                    </div>
                                    Cluster Distribution
                                </h3>
                                {renderChart()}
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Centroids Analysis</h3>
                                <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                                    <pre className="text-sm text-gray-300 font-mono">
                                        {JSON.stringify(result.centroids, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-12">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                <BarChart2 className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium">Run an analysis to see results</p>
                            <p className="text-sm">Configure parameters on the left and click Run</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClusteringPage;
