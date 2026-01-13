import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runClustering } from '../services/api';
import Layout from '../components/Layout';
import { Play, Settings, Calendar, Save, AlertTriangle, Loader } from 'lucide-react';

const AnalysisPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [config, setConfig] = useState({
        startDate: '2023-01-01',
        endDate: new Date().toISOString().slice(0, 10),
        algorithm: 'kmeans',
        n_clusters: 3,
        runName: `Analysis ${new Date().toLocaleDateString()}`
    });

    const handleRun = async () => {
        setLoading(true);
        setError('');
        try {
            await runClustering(
                config.algorithm,
                { n_clusters: parseInt(config.n_clusters) },
                config.runName,
                {
                    startDate: config.startDate,
                    endDate: config.endDate,
                    saveResult: true
                }
            );
            // Redirect to history to see results
            navigate('/history');
        } catch (err) {
            setError(err.message || "Analysis failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Analysis Workbench</h1>
                    <p className="text-gray-500">Configure and run customer segmentation algorithms.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-blue-50/50">
                        <h3 className="font-bold text-lg text-blue-900 flex items-center">
                            <Settings className="w-5 h-5 mr-2" /> Configuration
                        </h3>
                    </div>

                    <div className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date Range */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Data Range</label>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-gray-500">From</span>
                                        <input
                                            type="date"
                                            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                            value={config.startDate}
                                            onChange={e => setConfig({ ...config, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">To</span>
                                        <input
                                            type="date"
                                            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                                            value={config.endDate}
                                            onChange={e => setConfig({ ...config, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Algorithm Settings */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Algorithm Settings</label>
                                <div>
                                    <span className="text-xs text-gray-500 block mb-1">Model</span>
                                    <select
                                        className="w-full p-2.5 border rounded-lg bg-white"
                                        value={config.algorithm}
                                        onChange={e => setConfig({ ...config, algorithm: e.target.value })}
                                    >
                                        <option value="kmeans">K-Means Clustering</option>
                                        <option value="dbscan">DBSCAN (Density-Based)</option>
                                        <option value="hierarchical">Hierarchical</option>
                                    </select>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block mb-1">Number of Clusters</span>
                                    <input
                                        type="number"
                                        min="2" max="10"
                                        className="w-full p-2.5 border rounded-lg"
                                        value={config.n_clusters}
                                        onChange={e => setConfig({ ...config, n_clusters: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Run Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Run Name</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                value={config.runName}
                                onChange={e => setConfig({ ...config, runName: e.target.value })}
                                placeholder="e.g. Q1 2024 Segmentation"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleRun}
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transform hover:scale-105 transition-all shadow-lg shadow-blue-200 flex items-center disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                            Run Analysis
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AnalysisPage;
