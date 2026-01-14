import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Settings, PieChart, Menu, Bell, Search, LogOut, User, Database, Clock, FileText, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { notifications } = useNotification();

    const navItems = [
        { path: '/', label: 'Data Hub', icon: Database, roles: ['admin', 'staff', 'retail_system'] },
        { path: '/dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'retail_system'] },
        { path: '/analysis', label: 'Analysis Workbench', icon: Settings, roles: ['admin', 'staff'] },
        { path: '/rlfm', label: 'RLFM Analysis', icon: Activity, roles: ['admin'] },
        { path: '/history', label: 'History & Results', icon: Clock, roles: ['admin', 'staff'] },
        { path: '/strategy', label: 'Strategy Reports', icon: FileText, roles: ['admin', 'staff'] },
        { path: '/workflow', label: 'Workflow Automation', icon: FileText, roles: ['admin'] },
    ];

    const filteredNavItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));

    return (
        <div className="min-h-screen flex font-sans text-slate-800 bg-transparent">
            {/* Sidebar with Glass Effect */}
            <aside className="w-72 bg-slate-900/95 backdrop-blur-xl text-white flex flex-col shadow-2xl z-20 border-r border-white/10">
                <div className="p-8 flex items-center space-x-4 border-b border-white/10">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10">
                            <PieChart className="w-7 h-7 text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">WinMart DSS</h1>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Customer Intelligence</p>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Main Menu</p>
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                <span className="font-medium relative z-10">{item.label}</span>
                                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/10 bg-slate-900/50">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                        <Link to="/profile" className="flex items-center space-x-3 mb-4 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-xs font-semibold text-slate-400 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area with Modern Layout */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Modern Header */}
                <header className="h-20 px-8 flex items-center justify-between z-10 sticky top-0 bg-white/50 backdrop-blur-md border-b border-white/40 shadow-sm">
                    <div className="flex items-center">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900">
                            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-5">
                        <div className="relative hidden md:block group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search analytics..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm placeholder-slate-400 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all shadow-sm group-hover:shadow-md"
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

                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        <div className="relative group">
                            <button className="relative p-2.5 text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-md">
                                <Bell className="w-5 h-5" />
                                {notifications && notifications.length > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Main View */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
