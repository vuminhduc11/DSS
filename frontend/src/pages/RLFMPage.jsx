import React, { useState, useEffect } from 'react';
import { processRLFM, getRLFMData } from '../services/api';
import { Play, Loader, RefreshCw, AlertCircle } from 'lucide-react';

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">RLFM Analysis Data</h2>
                    <p className="text-gray-500">Recency, Length, Frequency, Monetary, Variety</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleProcess}
                        disabled={processing}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        {processing ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {processing ? 'Processing...' : 'Run RLFM Processing'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Customer Code</th>
                                <th className="px-6 py-4">Recency (day)</th>
                                <th className="px-6 py-4">Length (day)</th>
                                <th className="px-6 py-4">Frequency</th>
                                <th className="px-6 py-4">Monetary</th>
                                <th className="px-6 py-4">Variety</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && data.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-400">No data found. Upload data and run processing.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.customer_code}</td>
                                        <td className="px-6 py-4">{item.recency.toFixed(0)}</td>
                                        <td className="px-6 py-4">{item.length.toFixed(0)}</td>
                                        <td className="px-6 py-4">{item.frequency.toFixed(0)}</td>
                                        <td className="px-6 py-4">${item.monetary.toLocaleString()}</td>
                                        <td className="px-6 py-4">{item.variety.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Showing {Math.min(total, page * limit + 1)} - {Math.min(total, (page + 1) * limit)} of {total}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button
                            disabled={(page + 1) * limit >= total}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RLFMPage;
