import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import { getDataQuality } from '../services/api';
import { FileText, CheckCircle, AlertTriangle, Database, Calendar, DollarSign, Users } from 'lucide-react';

const UploadPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getDataQuality();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch data quality stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleUploadSuccess = () => {
        fetchStats();
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Ingestion</h2>
                    <p className="text-gray-500">Upload and validate your transaction data</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                    Refresh Stats
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Upload & Requirements */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            Upload Transaction Data
                        </h3>
                        <FileUpload onUploadSuccess={handleUploadSuccess} />
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                            <InfoIcon className="w-5 h-5 mr-2" />
                            Data Requirements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                            <div className="bg-white/50 p-3 rounded-lg">
                                <span className="font-semibold block mb-1">customer_code</span>
                                Unique identifier for the customer (String)
                            </div>
                            <div className="bg-white/50 p-3 rounded-lg">
                                <span className="font-semibold block mb-1">transaction_date</span>
                                Date of purchase (YYYY-MM-DD)
                            </div>
                            <div className="bg-white/50 p-3 rounded-lg">
                                <span className="font-semibold block mb-1">amount</span>
                                Transaction value (Numeric)
                            </div>
                            <div className="bg-white/50 p-3 rounded-lg">
                                <span className="font-semibold block mb-1">product_category</span>
                                Category of the item (String)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Data Quality Report */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3 text-green-600">
                                <Database className="w-5 h-5" />
                            </div>
                            Data Quality Report
                        </h3>

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                            </div>
                        ) : stats ? (
                            <div className="space-y-4">
                                <StatItem
                                    icon={Users}
                                    label="Total Customers"
                                    value={stats.total_customers.toLocaleString()}
                                    color="blue"
                                />
                                <StatItem
                                    icon={FileText}
                                    label="Total Transactions"
                                    value={stats.total_transactions.toLocaleString()}
                                    color="purple"
                                />
                                <StatItem
                                    icon={DollarSign}
                                    label="Total Revenue"
                                    value={`$${stats.total_revenue.toLocaleString()}`}
                                    color="green"
                                />
                                <StatItem
                                    icon={Calendar}
                                    label="Date Range"
                                    value={stats.date_range.start ?
                                        `${new Date(stats.date_range.start).toLocaleDateString()} - ${new Date(stats.date_range.end).toLocaleDateString()}`
                                        : 'N/A'}
                                    color="orange"
                                />

                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h4 className="font-semibold text-gray-700 mb-3">Health Check</h4>
                                    {stats.missing_values.product_category > 0 ? (
                                        <div className="flex items-start p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="font-semibold">Missing Categories:</span>
                                                <p>{stats.missing_values.product_category} records missing product_category</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center p-3 bg-green-50 text-green-800 rounded-lg text-sm">
                                            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span>All records look good!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-8">
                                No data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className={`p-2 rounded-lg mr-4 bg-${color}-100 text-${color}-600`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const InfoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export default UploadPage;
