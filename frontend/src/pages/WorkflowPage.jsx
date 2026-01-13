import React, { useState, useEffect } from 'react';
import { Upload, BarChart2, PieChart, FileText, CheckCircle, ChevronRight, ChevronLeft, Play, Loader, Users, DollarSign, TrendingUp, Zap, AlertTriangle, Calendar, Settings } from 'lucide-react';
import { previewFile, processFile, runClustering, getDashboardMetrics, getStrategy, getLatestRun } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

const STEPS = [
    { id: 1, name: 'Upload Data', icon: Upload, description: 'Tải dữ liệu giao dịch' },
    { id: 2, name: 'Run Analysis', icon: BarChart2, description: 'Phân tích phân cụm khách hàng' },
    { id: 3, name: 'Dashboard', icon: PieChart, description: 'Xem kết quả trực quan' },
    { id: 4, name: 'Strategy', icon: FileText, description: 'Chiến lược & Báo cáo' }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Helper component for column select
const ColumnSelect = ({ label, field, mapping, setMapping, columns, required }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            value={mapping[field] || ''}
            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
            className={`w-full p-2 border rounded-lg text-sm bg-white ${required && !mapping[field] ? 'border-red-200' : 'border-gray-200'}`}
        >
            <option value="">Chọn cột...</option>
            {columns.map(col => (
                <option key={col} value={col}>{col}</option>
            ))}
        </select>
    </div>
);

// ============== STEP 1: UPLOAD ==============
const UploadStep = ({ onComplete, completed }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [mapping, setMapping] = useState({});
    const [amountMode, setAmountMode] = useState('direct'); // 'direct' or 'calculate'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(completed);

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setError(null);

        try {
            const data = await previewFile(selectedFile);
            setPreviewData(data);

            // Smart auto-map columns
            const autoMap = {};
            const colsLower = data.columns.map(c => ({ orig: c, lower: c.toLowerCase().replace(/[_\s]/g, '') }));

            // Customer ID patterns
            const customerPatterns = ['customercode', 'customerid', 'custid', 'customer', 'khachhang', 'makh'];
            const customerMatch = colsLower.find(c => customerPatterns.some(p => c.lower.includes(p)));
            if (customerMatch) autoMap['customer_code'] = customerMatch.orig;

            // Date patterns
            const datePatterns = ['transactiondate', 'date', 'ngay', 'orderdate', 'invoicedate'];
            const dateMatch = colsLower.find(c => datePatterns.some(p => c.lower.includes(p)));
            if (dateMatch) autoMap['transaction_date'] = dateMatch.orig;

            // Amount patterns (direct total)
            const amountPatterns = ['amount', 'total', 'tongtien', 'revenue', 'sales', 'value'];
            const amountMatch = colsLower.find(c => amountPatterns.some(p => c.lower.includes(p)));
            if (amountMatch) autoMap['amount'] = amountMatch.orig;

            // Quantity patterns
            const qtyPatterns = ['quantity', 'qty', 'soluong', 'count', 'units'];
            const qtyMatch = colsLower.find(c => qtyPatterns.some(p => c.lower.includes(p)));
            if (qtyMatch) autoMap['quantity'] = qtyMatch.orig;

            // Unit price patterns
            const pricePatterns = ['unitprice', 'price', 'gia', 'dongia'];
            const priceMatch = colsLower.find(c => pricePatterns.some(p => c.lower.includes(p)));
            if (priceMatch) autoMap['unit_price'] = priceMatch.orig;

            // Category patterns (optional)
            const catPatterns = ['category', 'productcategory', 'loai', 'danhmuc'];
            const catMatch = colsLower.find(c => catPatterns.some(p => c.lower.includes(p)));
            if (catMatch) autoMap['product_category'] = catMatch.orig;

            // Transaction/Invoice ID patterns
            const txnPatterns = ['transactioncode', 'transactionid', 'invoiceno', 'invoiceid', 'orderid', 'mahd'];
            const txnMatch = colsLower.find(c => txnPatterns.some(p => c.lower.includes(p)));
            if (txnMatch) autoMap['transaction_code'] = txnMatch.orig;

            // Determine amount mode based on what's available
            if (amountMatch) {
                setAmountMode('direct');
            } else if (qtyMatch && priceMatch) {
                setAmountMode('calculate');
            }

            setMapping(autoMap);
        } catch (err) {
            setError('Không thể đọc file. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        setLoading(true);
        setError(null);

        // Validation
        if (!mapping.customer_code || !mapping.transaction_date) {
            setError('Vui lòng chọn cột Mã khách hàng và Ngày giao dịch.');
            setLoading(false);
            return;
        }
        if (amountMode === 'direct' && !mapping.amount) {
            setError('Vui lòng chọn cột Amount hoặc chuyển sang chế độ tính toán.');
            setLoading(false);
            return;
        }
        if (amountMode === 'calculate' && (!mapping.quantity || !mapping.unit_price)) {
            setError('Vui lòng chọn cả cột Quantity và Unit Price.');
            setLoading(false);
            return;
        }

        try {
            const finalMapping = { ...mapping, amount_mode: amountMode };
            await processFile(file, finalMapping);
            setSuccess(true);
            onComplete();
        } catch (err) {
            setError(err.response?.data?.detail || 'Xử lý thất bại');
        } finally {
            setLoading(false);
        }
    };

    const canProcess =
        mapping.customer_code &&
        mapping.transaction_date &&
        ((amountMode === 'direct' && mapping.amount) ||
            (amountMode === 'calculate' && mapping.quantity && mapping.unit_price));

    if (success) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Dữ liệu đã được tải lên!</h3>
                <p className="text-gray-500">Bạn có thể tiếp tục sang bước phân tích.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
                <input type="file" onChange={handleFileSelect} accept=".csv,.xlsx,.xls" className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Chọn file để tải lên</p>
                    <p className="text-sm text-gray-500">CSV, Excel (xlsx, xls)</p>
                </label>
            </div>

            {file && previewData && (
                <div className="bg-gray-50 rounded-xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{file.name}</span>
                        <span className="text-sm text-gray-500">{previewData.columns.length} cột</span>
                    </div>

                    {/* Amount Mode Toggle */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <label className="block text-sm font-bold text-blue-800 mb-2">Chế độ tính giá trị giao dịch</label>
                        <div className="flex gap-3">
                            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer flex-1 transition-all ${amountMode === 'direct' ? 'border-blue-500 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                                <input type="radio" name="amountMode" value="direct" checked={amountMode === 'direct'} onChange={() => setAmountMode('direct')} className="mr-2" />
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Cột Amount có sẵn</p>
                                    <p className="text-xs text-gray-500">File đã có tổng tiền</p>
                                </div>
                            </label>
                            <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer flex-1 transition-all ${amountMode === 'calculate' ? 'border-blue-500 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                                <input type="radio" name="amountMode" value="calculate" checked={amountMode === 'calculate'} onChange={() => setAmountMode('calculate')} className="mr-2" />
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Tính = Qty × Price</p>
                                    <p className="text-xs text-gray-500">Có số lượng & đơn giá</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Required Fields */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Trường bắt buộc</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <ColumnSelect label="Mã khách hàng" field="customer_code" mapping={mapping} setMapping={setMapping} columns={previewData.columns} required />
                            <ColumnSelect label="Ngày giao dịch" field="transaction_date" mapping={mapping} setMapping={setMapping} columns={previewData.columns} required />
                            {amountMode === 'direct' ? (
                                <ColumnSelect label="Tổng tiền (Amount)" field="amount" mapping={mapping} setMapping={setMapping} columns={previewData.columns} required />
                            ) : (
                                <>
                                    <ColumnSelect label="Số lượng (Quantity)" field="quantity" mapping={mapping} setMapping={setMapping} columns={previewData.columns} required />
                                    <ColumnSelect label="Đơn giá (Unit Price)" field="unit_price" mapping={mapping} setMapping={setMapping} columns={previewData.columns} required />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Trường tùy chọn</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <ColumnSelect label="Mã giao dịch/Hóa đơn" field="transaction_code" mapping={mapping} setMapping={setMapping} columns={previewData.columns} />
                            <ColumnSelect label="Danh mục sản phẩm" field="product_category" mapping={mapping} setMapping={setMapping} columns={previewData.columns} />
                        </div>
                    </div>

                    <button onClick={handleProcess} disabled={loading || !canProcess} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Xử lý dữ liệu'}
                    </button>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
};

// ============== STEP 2: ANALYSIS ==============
const AnalysisStep = ({ onComplete, completed }) => {
    const [algorithm, setAlgorithm] = useState('kmeans');
    const [nClusters, setNClusters] = useState(3);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // New Advanced Options
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [saveResult, setSaveResult] = useState(true);

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        try {
            const options = {
                startDate: startDate || null,
                endDate: endDate || null,
                saveResult
            };

            const res = await runClustering(
                algorithm,
                { n_clusters: nClusters },
                `Analysis_${Date.now()}`,
                options
            );

            setResult(res);
            // Only consider "completed" if saved, or maybe always? 
            // If satisfied with result, user can proceed.
            onComplete();
        } catch (err) {
            setError(err.response?.data?.detail || 'Phân tích thất bại. Hãy đảm bảo đã tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2" /> Cấu hình phân tích
                    </h4>

                    <div className="space-y-5">
                        {/* Algorithm Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Thuật toán</label>
                            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                                <option value="kmeans">K-Means Clustering</option>
                                <option value="hierarchical">Hierarchical Clustering</option>
                                <option value="gmm">Gaussian Mixture Model</option>
                                <option value="dbscan">DBSCAN</option>
                            </select>
                        </div>

                        {/* Cluster Count */}
                        {algorithm !== 'dbscan' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Số cụm (Clusters)</label>
                                <input type="number" min="2" max="10" value={nClusters} onChange={(e) => setNClusters(parseInt(e.target.value))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                            </div>
                        )}

                        {/* Date Range Filter */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-blue-500" /> Lọc dữ liệu (Tùy chọn)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Option */}
                        <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={saveResult}
                                onChange={(e) => setSaveResult(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-800">Lưu kết quả này</span>
                                <span className="block text-xs text-gray-500">Nếu bỏ chọn, kết quả sẽ chỉ hiển thị tạm thời</span>
                            </div>
                        </label>

                        <button onClick={handleRun} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center">
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 mr-2" />Chạy phân tích</>}
                        </button>
                    </div>
                </div>

                {/* Results Column */}
                <div className="bg-gray-50 rounded-xl p-6 flex flex-col">
                    <h4 className="font-bold text-gray-800 mb-4">Kết quả phân tích</h4>
                    {result ? (
                        <div className="space-y-5 flex-1">
                            <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg">
                                <span className="flex items-center font-medium"><CheckCircle className="w-5 h-5 mr-2" /> Hoàn tất!</span>
                                {result.saved ? (
                                    <span className="text-xs bg-green-200 px-2 py-1 rounded font-bold">SAVED</span>
                                ) : (
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">PREVIEW</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(result.counts).map(([cluster, count]) => (
                                    <div key={cluster} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${COLORS[cluster % COLORS.length]}`} style={{ backgroundColor: COLORS[cluster % COLORS.length] }}></div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cluster {cluster}</p>
                                        <p className="text-2xl font-bold text-gray-800">{count} <span className="text-sm font-normal text-gray-400">KH</span></p>
                                    </div>
                                ))}
                            </div>

                            {!result.saved && (
                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm flex items-start">
                                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                                    Bạn đang ở chế độ Xem trước. Kết quả này chưa được lưu vào Lịch sử.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-4">
                            <BarChart2 className="w-16 h-16 mb-3 opacity-20" />
                            <p>Chưa có kết quả</p>
                            <p className="text-sm">Hãy cấu hình và chạy phân tích</p>
                        </div>
                    )}
                </div>
            </div>
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center"><AlertTriangle className="w-5 h-5 mr-2" />{error}</div>}
        </div>
    );
};

// ============== STEP 3: DASHBOARD ==============
const DashboardStep = ({ onComplete }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const metrics = await getDashboardMetrics();
                setData(metrics);
                if (metrics.kpi?.total_customers > 0) onComplete();
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!data || data.kpi?.total_customers === 0) return <div className="text-center py-12 text-gray-500"><PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>Chưa có dữ liệu.</p></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white">
                    <Users className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{data.kpi.total_customers.toLocaleString()}</p>
                    <p className="text-sm opacity-80">Khách hàng</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-xl text-white">
                    <DollarSign className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">${data.kpi.total_revenue.toLocaleString()}</p>
                    <p className="text-sm opacity-80">Doanh thu</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 rounded-xl text-white">
                    <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">${Math.round(data.kpi.avg_order_value).toLocaleString()}</p>
                    <p className="text-sm opacity-80">Giá trị TB</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 h-64">
                    <h4 className="font-bold text-gray-800 mb-4">Xu hướng doanh thu</h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={data.sales_trend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 h-64">
                    <h4 className="font-bold text-gray-800 mb-4">Phân loại sản phẩm</h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <RechartsPie>
                            <Pie data={data.category_share} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                                {data.category_share.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ============== STEP 4: STRATEGY ==============
const StrategyStep = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const run = await getLatestRun();
                const data = await getStrategy(run.id);
                setStrategies(data);
            } catch (err) {
                setError('Vui lòng hoàn thành phân tích trước.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return <div className="text-center py-12"><AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" /><p className="text-gray-600">{error}</p></div>;

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="flex justify-between items-center print:hidden">
                <h4 className="font-bold text-gray-800">Chiến lược chăm sóc khách hàng</h4>
                <button onClick={() => window.print()} className="bg-white border border-gray-200 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />Xuất báo cáo
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
                {strategies.map((strat, index) => (
                    <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 print:border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h5 className="font-bold text-gray-800">{strat.segment_name}</h5>
                                <p className="text-sm text-gray-500">Cluster {strat.cluster}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{strat.customer_count} KH</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                            <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                            <span className="font-medium">${strat.avg_spend?.toFixed(0)}</span>
                            <span className="text-gray-400 ml-1">chi tiêu TB</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Zap className="w-4 h-4 mr-1 text-yellow-500" />Đề xuất
                            </div>
                            <p className="text-sm text-gray-600">{strat.strategy || strat.strategies?.[0]}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============== MAIN WORKFLOW ==============
const WorkflowPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);

    const markComplete = (stepId) => {
        if (!completedSteps.includes(stepId)) setCompletedSteps([...completedSteps, stepId]);
    };

    // Auto-detect existing data
    useEffect(() => {
        const checkExistingData = async () => {
            // We can use getDashboardMetrics or data-quality to check
            try {
                // If dashboard returns data, we have data
                const metrics = await getDashboardMetrics();
                if (metrics && metrics.kpi && metrics.kpi.total_customers > 0) {
                    // Data exists! Mark step 1 as complete and ideally move to step 2?
                    // Let's decide: If user just arrived, maybe show them step 2?
                    // Or just mark it green.
                    if (!completedSteps.includes(1)) {
                        setCompletedSteps(prev => [...prev, 1]);
                        // Auto-advance if currently on step 1
                        setCurrentStep(prev => prev === 1 ? 2 : prev);
                    }
                }
            } catch (e) {
                // No data or error
            }
        };
        checkExistingData();
    }, []);

    const canGoNext = completedSteps.includes(currentStep) || currentStep === 4;
    const canGoPrev = currentStep > 1;
    const goNext = () => { if (currentStep < 4) setCurrentStep(currentStep + 1); };
    const goPrev = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <UploadStep onComplete={() => markComplete(1)} completed={completedSteps.includes(1)} />;
            case 2: return <AnalysisStep onComplete={() => markComplete(2)} completed={completedSteps.includes(2)} />;
            case 3: return <DashboardStep onComplete={() => markComplete(3)} />;
            case 4: return <StrategyStep />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            <div className="bg-white border-b border-gray-100 py-6 print:hidden">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <button
                                    onClick={() => (completedSteps.includes(step.id - 1) || step.id === 1) && setCurrentStep(step.id)}
                                    disabled={step.id > 1 && !completedSteps.includes(step.id - 1)}
                                    className={`flex flex-col items-center transition-all ${currentStep === step.id ? 'scale-110' : ''} ${step.id > 1 && !completedSteps.includes(step.id - 1) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${completedSteps.includes(step.id) ? 'bg-green-500 text-white' : currentStep === step.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-100 text-gray-400'}`}>
                                        {completedSteps.includes(step.id) ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                                    </div>
                                    <span className={`text-sm font-medium ${currentStep === step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.name}</span>
                                </button>
                                {index < STEPS.length - 1 && <div className={`flex-1 h-1 mx-4 rounded ${completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[400px] print:shadow-none print:border-none">
                    <div className="mb-6 print:hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{STEPS[currentStep - 1].name}</h2>
                                <p className="text-gray-500">{STEPS[currentStep - 1].description}</p>
                            </div>
                            {/* If we skipped upload, show a hint */}
                            {currentStep === 2 && completedSteps.includes(1) && (
                                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Data Available
                                </div>
                            )}
                        </div>
                    </div>
                    {renderStep()}
                </div>
                <div className="flex justify-between mt-6 print:hidden">
                    <button onClick={goPrev} disabled={!canGoPrev} className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${canGoPrev ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <ChevronLeft className="w-5 h-5 mr-1" />Quay lại
                    </button>
                    {currentStep < 4 ? (
                        <button onClick={goNext} disabled={!canGoNext} className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${canGoNext ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                            Tiếp theo<ChevronRight className="w-5 h-5 ml-1" />
                        </button>
                    ) : (
                        <button onClick={() => window.print()} className="flex items-center px-6 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20">
                            <FileText className="w-5 h-5 mr-2" />Xuất báo cáo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowPage;
