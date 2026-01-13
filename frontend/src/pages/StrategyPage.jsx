import React, { useEffect, useState } from 'react';
import { Lightbulb, Target, Users, DollarSign, Zap, FileText, Mail, CheckCircle, AlertTriangle, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { getStrategy, getLatestRun } from '../services/api';

const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    'medium-high': 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200'
};

const priorityLabels = {
    high: 'Ưu tiên cao',
    'medium-high': 'Ưu tiên',
    medium: 'Bình thường',
    low: 'Thấp'
};

const StrategyCard = ({ strat }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group print:shadow-none print:border-gray-200 print:break-inside-avoid">
            <div className="p-6 border-b border-gray-50 print:border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{strat.segment_name}</h3>
                        <p className="text-sm text-gray-500 font-medium">Cluster {strat.cluster}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${priorityColors[strat.priority] || priorityColors.medium}`}>
                        {priorityLabels[strat.priority] || 'Normal'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl print:bg-transparent">
                        <div className="flex items-center text-gray-500 mb-1">
                            <Users className="w-4 h-4 mr-1" />
                            Khách hàng
                        </div>
                        <p className="text-lg font-bold text-gray-800">{strat.customer_count?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl print:bg-transparent">
                        <div className="flex items-center text-gray-500 mb-1">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Chi tiêu TB
                        </div>
                        <p className="text-lg font-bold text-green-600">${strat.avg_spend?.toFixed(0)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl print:bg-transparent">
                        <div className="flex items-center text-gray-500 mb-1">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Tần suất
                        </div>
                        <p className="text-lg font-bold text-blue-600">{strat.frequency?.toFixed(1)}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gradient-to-b from-white to-gray-50/50 print:bg-none">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center uppercase tracking-wide">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500 print:text-black" />
                    Chiến lược đề xuất
                </h4>

                <ul className="space-y-2 mb-4">
                    {(strat.strategies || [strat.strategy]).slice(0, expanded ? undefined : 2).map((s, i) => (
                        <li key={i} className="flex items-start text-gray-600 print:text-black">
                            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>{s}</span>
                        </li>
                    ))}
                </ul>

                {strat.strategies?.length > 2 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700 print:hidden"
                    >
                        {expanded ? (
                            <>Thu gọn <ChevronUp className="w-4 h-4 ml-1" /></>
                        ) : (
                            <>Xem thêm ({strat.strategies.length - 2}) <ChevronDown className="w-4 h-4 ml-1" /></>
                        )}
                    </button>
                )}

                {strat.email_template && (
                    <div className={`mt-4 pt-4 border-t border-gray-100 ${expanded || 'print:block hidden'}`}>
                        <h5 className="text-xs font-bold text-gray-500 mb-2 flex items-center uppercase">
                            <Mail className="w-3 h-3 mr-1" />
                            Mẫu Email
                        </h5>
                        <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg print:bg-transparent">
                            "{strat.email_template}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StrategyPage = () => {
    const [strategies, setStrategies] = useState([]);
    const [runInfo, setRunInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const run = await getLatestRun();
                setRunInfo(run);
                const strategiesData = await getStrategy(run.id);
                setStrategies(strategiesData);
            } catch (err) {
                setError("Không thể tải chiến lược. Hãy đảm bảo bạn đã chạy phân tích phân cụm ít nhất một lần.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = () => {
        window.print();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto mt-12">
            <div className="p-6 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 flex items-start shadow-sm">
                <div className="p-2 bg-amber-100 rounded-full mr-4 flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-1">Chưa có dữ liệu phân tích</h3>
                    <p className="mb-4">{error}</p>
                    <a
                        href="/clustering"
                        className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
                    >
                        Đi đến Phân tích
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10 print:p-0 print:space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start print:hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex-1 mr-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2 flex items-center">
                            <Target className="w-8 h-8 mr-3" />
                            Chiến lược & Báo cáo
                        </h2>
                        <p className="text-indigo-100 text-lg max-w-2xl">
                            Đề xuất chăm sóc khách hàng dựa trên phân tích: <span className="font-semibold text-white bg-white/20 px-2 py-1 rounded-lg ml-1">{runInfo?.name}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl font-bold shadow-sm flex items-center transition-all"
                >
                    <FileText className="w-5 h-5 mr-2" />
                    Xuất báo cáo
                </button>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo Chiến lược Chăm sóc Khách hàng</h1>
                <p className="text-gray-500">Ngày tạo: {new Date().toLocaleDateString('vi-VN')}</p>
                <p className="text-gray-500">Dựa trên phân tích: {runInfo?.name}</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Tổng phân khúc</p>
                    <p className="text-2xl font-bold text-gray-800">{strategies.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Tổng khách hàng</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {strategies.reduce((acc, s) => acc + (s.customer_count || 0), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Ưu tiên cao</p>
                    <p className="text-2xl font-bold text-red-600">
                        {strategies.filter(s => s.priority === 'high').length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Chi tiêu TB cao nhất</p>
                    <p className="text-2xl font-bold text-green-600">
                        ${Math.max(...strategies.map(s => s.avg_spend || 0)).toFixed(0)}
                    </p>
                </div>
            </div>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
                {strategies.map((strat, index) => (
                    <StrategyCard key={index} strat={strat} />
                ))}
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
                Hệ thống Hỗ trợ Ra quyết định - Báo cáo Nội bộ
            </div>
        </div>
    );
};

export default StrategyPage;
