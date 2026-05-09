import React from 'react';
import { HiX, HiTrash, HiOfficeBuilding, HiCurrencyDollar, HiUser, HiCalendar, HiIdentification, HiPhone, HiReceiptTax, HiBadgeCheck, HiClock } from 'react-icons/hi';
import { ocrService } from '../../services/ocrService';

const TransactionModal = ({ transaction, onClose, onDelete }) => {
  if (!transaction) return null;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await ocrService.deleteTransaction(transaction.id);
        onDelete(transaction.id);
        onClose();
      } catch (error) {
        alert('Failed to delete transaction');
      }
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blur Background Overlay */}
      <div 
        className="absolute inset-0 bg-white/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-5">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/5" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <HiBadgeCheck className="h-5 w-5 text-blue-200" />
                <h3 className="text-lg font-bold text-white">Transaction Details</h3>
              </div>
              <p className="text-sm text-blue-200">
                {transaction.date || 'No date'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          
          {/* Amount Card - Premium */}
          {transaction.amount > 0 && (
            <div className="mb-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 ring-1 ring-emerald-100">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                  Total Amount
                </p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-700">
                  Rs. {formatAmount(transaction.amount)}
                </p>
                {transaction.fee > 0 && (
                  <div className="mt-2 inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-3 py-1">
                    <HiReceiptTax className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      Fee: Rs. {formatAmount(transaction.fee)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Badge */}
          {transaction.status && (
            <div className="mb-4 flex justify-center">
              <span className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                transaction.status === 'Successful' 
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-200' 
                  : 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  transaction.status === 'Successful' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span>{transaction.status}</span>
              </span>
            </div>
          )}

          {/* Details List */}
          <div className="space-y-1.5">
            {transaction.bank && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <HiOfficeBuilding className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Bank / Wallet</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{transaction.bank}</span>
              </div>
            )}

            {transaction.sender && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <HiUser className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Sender</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{transaction.sender}</span>
              </div>
            )}

            {transaction.receiver && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <HiOfficeBuilding className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Receiver</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{transaction.receiver}</span>
              </div>
            )}

            {transaction.transaction_id && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <HiIdentification className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                </div>
                <span className="max-w-[140px] truncate font-mono text-xs font-semibold text-gray-900">
                  {transaction.transaction_id}
                </span>
              </div>
            )}

            {transaction.date && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                    <HiCalendar className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Date & Time</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {transaction.date}
                  </span>
                  {transaction.time && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <HiClock className="h-3 w-3" />
                      <span>{transaction.time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {transaction.consumer_number && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-50 text-lime-600">
                    <HiPhone className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Consumer #</span>
                </div>
                <span className="font-mono text-sm font-semibold text-gray-900">
                  {transaction.consumer_number}
                </span>
              </div>
            )}

            {transaction.payment_method && (
              <div className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <HiCurrencyDollar className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Method</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{transaction.payment_method}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex space-x-3">
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:shadow-sm"
            >
              <HiTrash className="h-4 w-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;