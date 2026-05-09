import React, { useState } from 'react';
import {
    HiX,
    HiCog,
    HiTrash,
    HiDatabase,
    HiShieldCheck,
    HiInformationCircle,
    HiCurrencyDollar,
} from 'react-icons/hi';
import { ocrService } from '../../services/ocrService';

const SettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [stats, setStats] = useState(null);

    React.useEffect(() => {
        if (isOpen) {
            loadStats();
        }
    }, [isOpen]);

    const loadStats = async () => {
        try {
            const result = await ocrService.getStats();
            if (result.success) {
                setStats(result.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleClearAllData = async () => {
        if (
            confirm(
                '⚠️ Are you sure you want to delete ALL transactions? This cannot be undone!'
            )
        ) {
            if (confirm('This will permanently delete all your data. Continue?')) {
                try {
                    const transactions = await ocrService.getTransactions({
                        limit: 10000,
                    });
                    if (transactions.success && transactions.transactions) {
                        for (const t of transactions.transactions) {
                            await ocrService.deleteTransaction(t.id);
                        }
                    }
                    alert('All transactions deleted.');
                    loadStats();
                    onClose();
                    window.location.reload();
                } catch (error) {
                    alert('Failed to clear data.');
                }
            }
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'General', icon: HiCog },
        { id: 'data', label: 'Data', icon: HiDatabase },
        { id: 'about', label: 'About', icon: HiInformationCircle },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blur Background */}
            <div
                className="absolute inset-0 bg-white/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                            <HiCog className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Settings</h3>
                            <p className="text-xs text-gray-500">Manage your application</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    >
                        <HiX className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700">
                                Application Settings
                            </h4>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            OCR Engine
                                        </p>
                                        <p className="text-xs text-gray-500">EasyOCR (Offline)</p>
                                    </div>
                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            AI Model
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Qwen 2.5 1.5B (Local)
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Database
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            SQLite (transactions.db)
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700">
                                Data Management
                            </h4>

                            {/* Stats */}
                            {stats && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-blue-50 p-4">
                                        <p className="text-xs font-medium text-blue-600">
                                            Total Records
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-blue-900">
                                            {stats.total || 0}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-green-50 p-4">
                                        <p className="text-xs font-medium text-green-600">
                                            Total Amount
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-green-900">
                                            Rs. {Number(stats.total_amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-purple-50 p-4">
                                        <p className="text-xs font-medium text-purple-600">
                                            Unique Banks
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-purple-900">
                                            {stats.unique_banks || 0}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-amber-50 p-4">
                                        <p className="text-xs font-medium text-amber-600">
                                            Unique Senders
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-amber-900">
                                            {stats.unique_senders || 0}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Export */}
                            <button
                                onClick={() => ocrService.exportCSV()}
                                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                                <HiDatabase className="h-5 w-5" />
                                <span>Export All Data as CSV</span>
                            </button>

                            {/* Clear Data */}
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
                                        <HiTrash className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">
                                            Clear All Data
                                        </p>
                                        <p className="mt-1 text-xs text-red-600">
                                            Permanently delete all transactions from the database.
                                            This action cannot be undone.
                                        </p>
                                        <button
                                            onClick={handleClearAllData}
                                            className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                                        >
                                            Delete All Transactions
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-5 text-center">
                            {/* Premium Logo */}
                            <div className="flex justify-center">
                                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-xl shadow-purple-500/30 ring-4 ring-purple-100">
                                    {/* Shine effects */}
                                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white/30 blur-[2px]" />
                                    <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-white/20 blur-[2px]" />

                                    <HiCurrencyDollar className="relative h-12 w-12 text-white drop-shadow-lg" />
                                </div>
                            </div>

                            {/* Brand */}
                            <div>
                                <h4 className="text-xl font-bold tracking-tight text-gray-900">
                                    Transaction<span className="text-purple-600">AI</span>
                                </h4>
                                <div className="mt-1 flex items-center justify-center space-x-1.5">
                                    <span className="inline-block h-1 w-1 rounded-full bg-purple-400" />
                                    <p className="text-sm font-medium tracking-wide text-gray-400">
                                        Automated Accounting
                                    </p>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-2.5 rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5 text-left shadow-inner">
                                <div className="flex items-start space-x-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                                        <HiShieldCheck className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">100% Private & Offline</p>
                                        <p className="text-xs text-gray-500">Your financial data never leaves this computer</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                        <HiCog className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">AI-Powered Extraction</p>
                                        <p className="text-xs text-gray-500">EasyOCR + Qwen 2.5 1.5B via Ollama</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                                        <HiDatabase className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Local Storage</p>
                                        <p className="text-xs text-gray-500">SQLite database on your machine</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-400">
                                    Version 1.0.0
                                </p>
                                <p className="text-xs text-gray-300">
                                    Made with ❤️ by <span className="font-semibold text-purple-500">Muhammad Bilal Haha</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
