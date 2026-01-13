import React, { useState, useEffect } from 'react';
import { getDataQuality, createTransaction } from '../services/api';
import { Database, Plus, Users, DollarSign, FileText, Calendar, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import Layout from '../components/Layout';

const DataManagementPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form State
    const [formData, setFormData] = useState({
        customer_code: '',
        customer_name: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: '',
        product_category: ''
    });

    const fetchStats = async () => {
        try {
            const data = await getDataQuality();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (!formData.customer_code || !formData.amount || !formData.transaction_date) {
                throw new Error("Please fill in all required fields.");
            }

            await createTransaction({
                ...formData,
                amount: parseFloat(formData.amount)
            });

            setMessage({ type: 'success', text: 'Transaction added successfully!' });
            setFormData({
                customer_code: '',
                customer_name: '',
                transaction_date: new Date().toISOString().slice(0, 10),
                amount: '',
                product_category: ''
            });

            // Refresh stats
            fetchStats();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to add transaction.' });
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center items-center h-96">
                <Loader className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Data Management</h1>
                    <p className="text-gray-500">Monitor data quality and manually input records.</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase">Total Txns</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.total_transactions?.toLocaleString() || 0}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-emerald-50 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase">Customers</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.total_customers?.toLocaleString() || 0}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-violet-50 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-violet-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase">Revenue</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">${stats?.total_revenue?.toLocaleString() || 0}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-amber-50 p-3 rounded-lg">
                                <Calendar className="w-6 h-6 text-amber-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase">Date Range</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                            {stats?.date_range?.start ? new Date(stats.date_range.start).toLocaleDateString() : 'N/A'}
                            <span className="mx-2">-</span>
                            {stats?.date_range?.end ? new Date(stats.date_range.end).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Manual Entry */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-blue-50">
                            <h3 className="font-bold text-lg text-blue-800 flex items-center">
                                <Plus className="w-5 h-5 mr-2" /> Manual Entry
                            </h3>
                            <span className="text-xs font-semibold text-blue-600 bg-white px-2 py-1 rounded">Single Record</span>
                        </div>
                        <div className="p-6 flex-1">
                            {message.text && (
                                <div className={`mb-4 p-3 rounded-lg text-sm flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                    {message.text}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Customer Code *</label>
                                        <input type="text" name="customer_code" value={formData.customer_code} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. C001" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Date *</label>
                                        <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Amount *</label>
                                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="0.00" step="0.01" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Name (Opt)</label>
                                        <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Name" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Category (Opt)</label>
                                        <input type="text" name="product_category" value={formData.product_category} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Category" />
                                    </div>
                                </div>
                                <button type="submit" disabled={formLoading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center">
                                    {formLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Add Record'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Quick Upload */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-green-50">
                            <h3 className="font-bold text-lg text-green-800 flex items-center">
                                <Database className="w-5 h-5 mr-2" /> Bulk Upload
                            </h3>
                            <span className="text-xs font-semibold text-green-600 bg-white px-2 py-1 rounded">Excel / CSV</span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                            <p className="text-gray-500 mb-6 text-sm">Upload large datasets directly to the system. Ideal for initial setup or monthly updates.</p>
                            <a href="/" className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center">
                                <FileText className="w-4 h-4 mr-2" /> Go to Workflow Upload
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DataManagementPage;
