import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, CloudUpload } from 'lucide-react';
import { uploadFile } from '../services/api';

const FileUpload = () => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // success, error
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
            setFile(e.dataTransfer.files[0]);
            setStatus(null);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setStatus(null);
        try {
            const res = await uploadFile(file);
            setStatus('success');
            setMessage(res.message);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <CloudUpload className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Upload Data</h2>
                    <p className="text-gray-500 mt-2">Import your transaction data to update the system</p>
                </div>

                <div
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${dragActive
                            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleChange}
                        accept=".csv,.xlsx,.xls"
                    />

                    <div className="flex flex-col items-center justify-center space-y-4">
                        {file ? (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-blue-50 rounded-full text-blue-500 mb-2">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <div>
                                    <span className="font-semibold text-blue-600 hover:underline">Click to upload</span>
                                    <span className="text-gray-500"> or drag and drop</span>
                                </div>
                                <p className="text-sm text-gray-400">CSV or Excel files (max 10MB)</p>
                            </>
                        )}
                    </div>
                </div>

                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`mt-6 w-full py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 ${uploading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30'
                            }`}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center">
                                <Loader className="w-5 h-5 animate-spin mr-2" />
                                Processing Data...
                            </span>
                        ) : (
                            'Upload & Process'
                        )}
                    </button>
                )}

                {status === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center border border-green-100 animate-fade-in">
                        <div className="p-1 bg-green-100 rounded-full mr-3">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        {message}
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100 animate-fade-in">
                        <div className="p-1 bg-red-100 rounded-full mr-3">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
