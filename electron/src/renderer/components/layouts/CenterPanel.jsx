import React, { useState, useMemo } from 'react';
import {
    HiSearch,
    HiDownload,
    HiSortAscending,
    HiSortDescending,
    HiTrash,
    HiEye,
    HiUser,
    HiCalendar,
    HiChevronLeft,
    HiChevronRight,
    HiDocumentText,
    HiDuplicate,
} from 'react-icons/hi';
import { useAppContext } from '../../context/AppContext';
import { ocrService } from '../../services/ocrService';
import EmptyState from '../common/EmptyState';

const CenterPanel = () => {
    const { transactions, loadTransactions } = useAppContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const itemsPerPage = 15;

    // Find duplicates: match on transaction_id OR bank+sender+amount+date+receiver
    const duplicates = useMemo(() => {
        const seen = {};
        const seenNoId = {};
        const dups = [];
        const processed = new Set();

        transactions.forEach((t) => {
            if (processed.has(t.id)) return;

            const tid = t.transaction_id?.trim();

            if (tid) {
                const key = `${tid}_${t.amount}_${t.date}`;

                if (key in seen) {
                    const existingGroup = dups.find((g) => g.key === key);
                    if (existingGroup) {
                        existingGroup.transactions.push(t);
                        processed.add(t.id);
                    } else {
                        dups.push({
                            key,
                            matchType: 'Transaction ID',
                            transactions: [seen[key], t],
                        });
                        processed.add(seen[key].id);
                        processed.add(t.id);
                    }
                } else {
                    seen[key] = t;
                }
            } else {
                const key = `${t.bank}_${t.sender}_${t.amount}_${t.date}_${t.receiver}`;

                if (key in seenNoId) {
                    const existingGroup = dups.find((g) => g.key === key);
                    if (existingGroup) {
                        existingGroup.transactions.push(t);
                        processed.add(t.id);
                    } else {
                        dups.push({
                            key,
                            matchType: 'Bank+Sender+Amount+Date',
                            transactions: [seenNoId[key], t],
                        });
                        processed.add(seenNoId[key].id);
                        processed.add(t.id);
                    }
                } else {
                    seenNoId[key] = t;
                }
            }
        });

        return dups;
    }, [transactions]);

    const duplicateCount = duplicates.reduce(
        (sum, g) => sum + g.transactions.length - 1,
        0
    );

    // Statistics
    const stats = useMemo(() => {
        const total = transactions.length;
        const totalAmount = transactions.reduce(
            (sum, t) => sum + (Number(t.amount) || 0),
            0
        );
        const uniqueBanks = new Set(transactions.map((t) => t.bank).filter(Boolean)).size;
        const uniqueSenders = new Set(transactions.map((t) => t.sender).filter(Boolean)).size;

        return { total, totalAmount, uniqueBanks, uniqueSenders };
    }, [transactions]);

    // Filter and sort transactions
    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    (t.bank && t.bank.toLowerCase().includes(query)) ||
                    (t.sender && t.sender.toLowerCase().includes(query)) ||
                    (t.receiver && t.receiver.toLowerCase().includes(query)) ||
                    (t.transaction_id && t.transaction_id.toLowerCase().includes(query)) ||
                    (t.amount && String(t.amount).includes(query)) ||
                    (t.date && t.date.includes(query))
            );
        }

        filtered.sort((a, b) => {
            let aVal = a[sortField] || '';
            let bVal = b[sortField] || '';

            if (sortField === 'amount') {
                aVal = Number(aVal) || 0;
                bVal = Number(bVal) || 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [transactions, searchQuery, sortField, sortDirection]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (confirm('Delete this transaction?')) {
            await ocrService.deleteTransaction(id);
            loadTransactions();
        }
    };

    const handleDeleteDuplicate = async (id) => {
        await ocrService.deleteTransaction(id);
        loadTransactions();
    };

    const handleExport = async () => {
        await ocrService.exportCSV();
    };

    const formatAmount = (amount) => {
        if (!amount) return '-';
        return Number(amount).toLocaleString();
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field)
            return <HiSortAscending className="h-3 w-3 text-gray-300" />;
        return sortDirection === 'asc' ? (
            <HiSortAscending className="h-3 w-3 text-blue-500" />
        ) : (
            <HiSortDescending className="h-3 w-3 text-blue-500" />
        );
    };

    if (transactions.length === 0) {
        return (
            <main className="flex flex-1 items-center justify-center bg-gray-50 p-6">
                <EmptyState
                    icon={HiDocumentText}
                    title="No Transactions Yet"
                    description="Upload payment screenshots to see extracted transactions here"
                    iconSize="large"
                />
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col bg-gray-50">
            {/* Duplicate Alert Banner */}
            {duplicateCount > 0 && (
                <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowDuplicates(!showDuplicates)}
                            className="flex items-center space-x-2 text-amber-700 hover:text-amber-800"
                        >
                            <HiDuplicate className="h-5 w-5" />
                            <span className="text-sm font-medium">
                                {duplicateCount} duplicate transaction{duplicateCount > 1 ? 's' : ''} found
                            </span>
                            <span className="text-xs text-amber-500">
                                (Click to {showDuplicates ? 'hide' : 'review'})
                            </span>
                        </button>
                        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            {duplicates.length} group{duplicates.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            )}

            {/* Duplicate Details Panel */}
            {showDuplicates && duplicates.length > 0 && (
                <div className="max-h-80 overflow-y-auto border-b border-amber-200 bg-amber-50/50 px-6 py-4">
                    <h4 className="mb-3 text-sm font-semibold text-amber-800">
                        Duplicate Groups
                    </h4>
                    <div className="space-y-3">
                        {duplicates.map((group) => {
                            const first = group.transactions[0];
                            return (
                                <div
                                    key={group.key}
                                    className="rounded-lg border border-amber-200 bg-white p-3"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                Matched by: {group.matchType}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {first.bank} • {first.date}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700">
                                                Rs. {formatAmount(first.amount)}
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium text-amber-600">
                                            {group.transactions.length}x duplicated
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {group.transactions.map((t, i) => (
                                            <div
                                                key={t.id}
                                                className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
                                                    i === 0
                                                        ? 'border border-green-200 bg-green-50'
                                                        : 'border border-red-200 bg-red-50'
                                                }`}
                                            >
                                                <div className="flex min-w-0 flex-1 items-center space-x-3">
                                                    <span
                                                        className={`inline-flex flex-shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                                            i === 0
                                                                ? 'bg-green-200 text-green-800'
                                                                : 'bg-red-200 text-red-800'
                                                        }`}
                                                    >
                                                        {i === 0 ? '✓ Keep' : '✗ Duplicate'}
                                                    </span>
                                                    <span className="truncate text-gray-600">
                                                        {t.sender} → {t.receiver}
                                                    </span>
                                                    {t.transaction_id && (
                                                        <span className="flex-shrink-0 font-mono text-gray-400">
                                                            ID: {t.transaction_id}
                                                        </span>
                                                    )}
                                                    <span className="truncate text-gray-400">{t.source_file}</span>
                                                </div>
                                                {i > 0 && (
                                                    <button
                                                        onClick={() => handleDeleteDuplicate(t.id)}
                                                        className="ml-2 flex flex-shrink-0 items-center space-x-1 rounded px-2 py-1 text-red-600 hover:bg-red-100"
                                                    >
                                                        <HiTrash className="h-3.5 w-3.5" />
                                                        <span>Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="border-b border-gray-200 bg-white px-6 py-4">
                <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-xl bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-600">Total Transactions</p>
                        <p className="mt-1 text-2xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-xs font-medium text-green-600">Total Amount</p>
                        <p className="mt-1 text-2xl font-bold text-green-900">
                            Rs. {formatAmount(stats.totalAmount)}
                        </p>
                    </div>
                    <div className="rounded-xl bg-purple-50 p-3">
                        <p className="text-xs font-medium text-purple-600">Banks/Wallets</p>
                        <p className="mt-1 text-2xl font-bold text-purple-900">{stats.uniqueBanks}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-600">Unique Senders</p>
                        <p className="mt-1 text-2xl font-bold text-amber-900">{stats.uniqueSenders}</p>
                    </div>
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="border-b border-gray-200 bg-white px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="relative max-w-md flex-1">
                        <HiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by bank, sender, amount, date..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                            {filteredTransactions.length} records
                        </span>
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <HiDownload className="h-4 w-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 bg-gray-100 text-left">
                        <tr>
                            <th
                                className="cursor-pointer px-6 py-3 text-xs font-semibold uppercase text-gray-600 hover:bg-gray-200"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Date</span>
                                    <SortIcon field="date" />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase text-gray-600 hover:bg-gray-200"
                                onClick={() => handleSort('bank')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Bank</span>
                                    <SortIcon field="bank" />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase text-gray-600 hover:bg-gray-200"
                                onClick={() => handleSort('sender')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Sender</span>
                                    <SortIcon field="sender" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Receiver</th>
                            <th
                                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600 hover:bg-gray-200"
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center justify-end space-x-1">
                                    <span>Amount</span>
                                    <SortIcon field="amount" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedTransactions.map((transaction, index) => {
                            const isDuplicate = duplicates.some((g) =>
                                g.transactions.slice(1).some((t) => t.id === transaction.id)
                            );

                            return (
                                <tr
                                    key={transaction.id}
                                    className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                                        isDuplicate
                                            ? 'bg-red-50/50'
                                            : index % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-gray-50/50'
                                    }`}
                                >
                                    <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <HiCalendar className="h-4 w-4 text-gray-400" />
                                            <span>{transaction.date || '-'}</span>
                                            {isDuplicate && (
                                                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                                                    DUP
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                            {transaction.bank || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {transaction.sender || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {transaction.receiver || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                        Rs. {formatAmount(transaction.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                transaction.status === 'Successful'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                        >
                                            {transaction.status || 'Successful'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <button
                                                onClick={(e) => handleDelete(transaction.id, e)}
                                                className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <HiTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
                    <p className="text-xs text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
                        {filteredTransactions.length}
                    </p>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <HiChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 rounded-lg text-xs font-medium ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <HiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default CenterPanel;