import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Layout from '../components/Layout';
import { User, Mail, Lock, Save, Home } from 'lucide-react';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name,
                email: user.email
            }));
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                full_name: formData.full_name,
                password: formData.password || undefined
            };
            await updateProfile(updateData);
            showNotification('Profile updated successfully!', 'success');
            window.location.reload();
        } catch (error) {
            showNotification('Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Role Badge Color Helper
    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'staff': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'retail_system': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your personal information and security preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Info Card */}
                    <div className="col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mx-auto mb-4">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{user?.full_name || 'User'}</h2>
                            <p className="text-sm text-gray-500 mb-4">{user?.email}</p>

                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(user?.role)}`}>
                                <span className="uppercase tracking-wider">{user?.role?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border-b border-gray-100 pb-6 mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-blue-600" /> Personal Information
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                            <div className="relative">
                                                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="pl-10 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2 flex items-center">
                                                <Lock className="w-3 h-3 mr-1" /> Email cannot be changed for security reasons.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        <Lock className="w-5 h-5 mr-2 text-blue-600" /> Security
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Leave blank to keep"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:shadow-lg hover:translate-y-[-1px] transition-all disabled:opacity-70 flex items-center"
                                    >
                                        {loading ? (
                                            <span className="flex items-center">Saving...</span>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
