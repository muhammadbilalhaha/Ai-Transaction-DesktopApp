import React, { useState } from 'react';
import { HiClock, HiCheckCircle } from 'react-icons/hi';
import { useAppContext } from '../../context/AppContext';
import TransactionModal from './TransactionModal';

const TransactionList = () => {
  const { transactions, isLoadingTransactions } = useAppContext();
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteTransaction = (id) => {
    // Transaction will be removed from the list by the parent
    console.log('Transaction deleted:', id);
  };

  if (isLoadingTransactions) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
            Recent Transactions
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
            Recent Transactions
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <HiClock className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No transactions yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
            Recent Transactions
          </h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {transactions.length}
          </span>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {transactions.slice(0, 50).map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => setSelectedTransaction(transaction)}
              className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <HiCheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {transaction.bank || 'Unknown Bank'}
                    </p>
                    {transaction.amount > 0 && (
                      <span className="ml-2 shrink-0 text-sm font-semibold text-gray-900">
                        Rs. {Number(transaction.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {transaction.sender || 'Unknown'}
                    {transaction.date && ` • ${transaction.date}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onDelete={handleDeleteTransaction}
        />
      )}
    </>
  );
};

export default TransactionList;
