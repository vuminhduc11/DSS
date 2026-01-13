import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Settings, PieChart, Menu, Bell, Search, LogOut, User, Database, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { notifications } = useNotification();

    const navItems = [
        { path: '/', label: 'Data Hub', icon: Database },
        { path: '/analysis', label: 'Analysis Workbench', icon: Settings },
        { path: '/history', label: 'History & Results', icon: Clock },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
                <div className="p-8 flex items-center space-x-3 border-b border-slate-800">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Nexus DSS</h1>
                        <p className="text-xs text-slate-400">Customer Intelligence</p>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main Menu</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-slate-800">
                    <div className="bg-slate-800 rounded-xl p-4">
                        <Link to="/profile" className="flex items-center space-x-3 mb-3 hover:bg-slate-700 p-2 rounded-lg transition-colors cursor-pointer block">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                        >
                            <LogOut className="w-3 h-3" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center text-gray-800">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="relative hidden md:block">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search (e.g., 'Cluster', 'Upload')..."
                                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value.toLowerCase();
                                        if (val.includes('cluster') || val.includes('analy')) window.location.href = '/analysis';
                                        else if (val.includes('upload') || val.includes('data')) window.location.href = '/';
                                        else if (val.includes('hist')) window.location.href = '/history';
                                    }
                                }}
                            />
                        </div>

                        <div className="relative group">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                <Bell className="w-6 h-6" />
                                {notifications && notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                                <div className="p-4 border-b border-gray-50 bg-gray-50">
                                    <h4 className="font-semibold text-gray-800">Notifications</h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications && notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start">
                                                <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 ${n.type === 'success' ? 'bg-green-500' :
                                                    n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}></div>
                                                <div>
                                                    <p className="text-sm text-gray-600">{n.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">Just now</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            No new notifications
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
