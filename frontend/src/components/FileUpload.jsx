import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, CloudUpload, ArrowRight, Table, Calculator } from 'lucide-react';
import { previewFile, processFile } from '../services/api';

const REQUIRED_FIELDS = [
    { key: 'customer_code', label: 'Customer ID', description: 'Unique identifier for the customer', required: true },
    { key: 'transaction_date', label: 'Transaction Date', description: 'Date of the transaction', required: true },
    { key: 'transaction_code', label: 'Transaction/Invoice ID', description: 'Grouping identifier for unique orders (Frequency)', required: false },
    { key: 'product_category', label: 'Product Category', description: 'Category of the item purchased', required: true }
];

const FileUpload = ({ onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);

    // Steps: 'select', 'preview', 'processing', 'success'
    const [step, setStep] = useState('select');
    const [previewData, setPreviewData] = useState(null);
    const [mapping, setMapping] = useState({});
    const [amountMode, setAmountMode] = useState('single'); // 'single' (Amount) or 'calc' (Qty * Price)
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = async (selectedFile) => {
        setFile(selectedFile);
        setError(null);
        setStep('loading');

        try {
            const data = await previewFile(selectedFile);
            setPreviewData(data);

            // Auto-map columns
            const autoMap = {};
            const allFields = [
                ...REQUIRED_FIELDS,
                { key: 'amount', label: 'Total Amount' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'unit_price', label: 'Unit Price' }
            ];

            allFields.forEach(field => {
                const match = data.columns.find(col =>
                    col.toLowerCase().replace(/_/g, '').includes(field.key.replace(/_/g, '')) ||
                    col.toLowerCase() === field.label?.replace(/ /g, '').toLowerCase()
                );
                if (match) {
                    autoMap[field.key] = match;
                }
            });
            setMapping(autoMap);
            setStep('preview');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to preview file');
            setStep('select');
            setFile(null);
        }
    };

    const handleProcess = async () => {
        setStep('processing');
        setError(null);

        // Clean up mapping based on mode
        const finalMapping = { ...mapping };
        if (amountMode === 'single') {
            delete finalMapping.quantity;
            delete finalMapping.unit_price;
        } else {
            delete finalMapping.amount;
        }

        try {
            const res = await processFile(file, finalMapping);
            setMessage(res.message);
            setStep('success');
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || 'Processing failed');
            setStep('preview');
        }
    };

    const resetUpload = () => {
        setFile(null);
        setPreviewData(null);
        setMapping({});
        setStep('select');
        setError(null);
        setMessage('');
    };

    const isValid = () => {
        const basicValid = REQUIRED_FIELDS.every(f => !f.required || mapping[f.key]);
        const amountValid = amountMode === 'single' ? !!mapping.amount : (!!mapping.quantity && !!mapping.unit_price);
        return basicValid && amountValid;
    };

    if (step === 'success') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Successful!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                    onClick={resetUpload}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                >
                    Upload Another File
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CloudUpload className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-800">Data Import Wizard</h3>
                </div>
                {step !== 'select' && (
                    <button
                        onClick={resetUpload}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <div className="p-8">
                {step === 'select' || step === 'loading' ? (
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragActive
                            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {step === 'loading' ? (
                            <div className="flex flex-col items-center">
                                <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                <p className="text-gray-600 font-medium">Analyzing file...</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleChange}
                                    accept=".csv,.xlsx,.xls"
                                />
                                <div className="p-4 bg-blue-50 rounded-full text-blue-500 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">Drop your file here</h4>
                                <p className="text-gray-500 mb-1">Supports CSV, Excel (xlsx, xls)</p>
                                <p className="text-gray-400 text-sm">Max size 10MB</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* File Info */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-gray-500" />
                                <span className="font-medium text-gray-700">{file?.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{(file?.size / 1024).toFixed(1)} KB</span>
                        </div>

                        {/* Column Mapping */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                                    <Table className="w-4 h-4 mr-2" />
                                    Map Database Columns
                                </h4>
                                <div className="space-y-5">
                                    {REQUIRED_FIELDS.map((field) => (
                                        <div key={field.key}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            <select
                                                value={mapping[field.key] || ''}
                                                onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select column ({field.required ? 'Required' : 'Optional'})...</option>
                                                {previewData?.columns.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
                                        </div>
                                    ))}

                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="font-semibold text-blue-900 flex items-center">
                                                <Calculator className="w-4 h-4 mr-2" />
                                                Amount Calculation
                                            </label>
                                            <div className="flex bg-white rounded-lg p-1 border border-blue-200">
                                                <button
                                                    onClick={() => setAmountMode('single')}
                                                    className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${amountMode === 'single' ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    Total Column
                                                </button>
                                                <button
                                                    onClick={() => setAmountMode('calc')}
                                                    className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${amountMode === 'calc' ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    Qty * Price
                                                </button>
                                            </div>
                                        </div>

                                        {amountMode === 'single' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                                    Total Amount Column <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={mapping['amount'] || ''}
                                                    onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                                                    className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">Select amount column...</option>
                                                    {previewData?.columns.map(col => (
                                                        <option key={col} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-800 mb-1">
                                                        Quantity Column <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={mapping['quantity'] || ''}
                                                        onChange={(e) => setMapping({ ...mapping, quantity: e.target.value })}
                                                        className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="">Select quantity column...</option>
                                                        {previewData?.columns.map(col => (
                                                            <option key={col} value={col}>{col}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-800 mb-1">
                                                        Unit Price Column <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={mapping['unit_price'] || ''}
                                                        onChange={(e) => setMapping({ ...mapping, unit_price: e.target.value })}
                                                        className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="">Select price column...</option>
                                                        {previewData?.columns.map(col => (
                                                            <option key={col} value={col}>{col}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Data Preview */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-4">File Preview (First 5 Rows)</h4>
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {previewData?.columns.slice(0, 3).map(col => (
                                                    <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate max-w-[100px]">
                                                        {col}
                                                    </th>
                                                ))}
                                                {previewData?.columns.length > 3 && (
                                                    <th className="px-3 py-2 text-gray-400">...</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {previewData?.sample.map((row, i) => (
                                                <tr key={i}>
                                                    {previewData?.columns.slice(0, 3).map(col => (
                                                        <td key={`${i}-${col}`} className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 truncate max-w-[100px]">
                                                            {String(row[col])}
                                                        </td>
                                                    ))}
                                                    {previewData?.columns.length > 3 && (
                                                        <td className="px-3 py-2 text-gray-400">...</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl text-xs text-blue-700">
                                    <p className="font-semibold mb-1">Tips:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Map <strong>Invoice ID</strong> to calculate Frequency accurately (Unique orders per customer).</li>
                                        <li>If you don't map Invoice ID, Frequency will count total rows (items).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleProcess}
                                disabled={step === 'processing' || !isValid()}
                                className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${step === 'processing' || !isValid()
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20'
                                    }`}
                            >
                                {step === 'processing' ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Start Import</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100 animate-fade-in">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
