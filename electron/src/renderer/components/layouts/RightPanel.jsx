import React, { useState } from 'react';
import {
  HiDocumentText,
  HiCheck,
  HiPhotograph,
  HiExclamation,
  HiCurrencyDollar,
  HiUser,
  HiOfficeBuilding,
  HiCalendar,
  HiIdentification,
  HiChevronLeft,
  HiChevronRight,
  HiCollection,
} from 'react-icons/hi';
import EmptyState from '../common/EmptyState';
import { useAppContext } from '../../context/AppContext';
import { ocrService } from '../../services/ocrService';
import NameSuggest from '../common/NameSuggest';
import {
  addKnownSender,
  addKnownReceiver,
  autoCorrectName,
} from '../../utils/nameMatcher';

const RightPanel = () => {
  const {
    currentScreenshot,
    extractedData,
    addTransaction,
    removeScreenshot,
    loadTransactions,
    batchResults,
    batchQueue,
  } = useAppContext();

  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [correctedSender, setCorrectedSender] = useState(null);
  const [correctedReceiver, setCorrectedReceiver] = useState(null);

  // Get completed batch results
  const completedBatchResults = batchResults.filter(
    (r) => r.status === 'completed' && r.transaction
  );

  // Determine what to show
  const showingBatch = completedBatchResults.length > 0 && !currentScreenshot;
  const showingSingle = !!currentScreenshot;

  const handleSaveSingle = async () => {
    if (extractedData?.transaction && !isSaving) {
      setIsSaving(true);
      try {
        // Auto-correct names
        const transaction = { ...extractedData.transaction };

        if (correctedSender) {
          transaction.sender = correctedSender;
        }
        if (correctedReceiver) {
          transaction.receiver = correctedReceiver;
        }

        const result = await ocrService.saveTransaction(transaction);
        if (result.success) {
          // Learn the names
          if (transaction.sender) addKnownSender(transaction.sender);
          if (transaction.receiver) addKnownReceiver(transaction.receiver);

          addTransaction(transaction);
          removeScreenshot();
          showNotification(
            '✅ Transaction saved! Names learned for future.',
            'success'
          );
        } else {
          showNotification(
            '⚠️ Saved. Check for duplicates in table.',
            'yellow'
          );
        }
      } catch (err) {
        showNotification('❌ Failed to save', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveBatchItem = async (batchItem) => {
    if (batchItem.transaction) {
      try {
        const result = await ocrService.saveTransaction(batchItem.transaction);
        if (result.success) {
          addTransaction(batchItem.transaction);
          alert('Transaction saved!');
        } else if (result.error?.includes('Duplicate')) {
          alert('This transaction already exists!');
        } else {
          alert('Failed to save: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Failed to save transaction');
      }
    }
  };

  const renderTransactionFields = (transaction) => {
    if (!transaction) return null;

    return (
      <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4">
        {transaction.bank && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiOfficeBuilding className="h-4 w-4" />
              <span>Bank</span>
            </div>
            <span className="font-semibold text-gray-900">
              {transaction.bank}
            </span>
          </div>
        )}

        {transaction.amount > 0 && (
          <div className="flex items-center justify-between border-t border-green-100 pt-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiCurrencyDollar className="h-4 w-4" />
              <span>Amount</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              Rs. {Number(transaction.amount).toLocaleString()}
            </span>
          </div>
        )}

        {transaction.sender && (
          <div className="flex items-center justify-between border-t border-green-100 pt-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiUser className="h-4 w-4" />
              <span>Sender</span>
            </div>
            <span className="font-medium text-gray-900">
              {transaction.sender}
            </span>
          </div>
        )}

        {transaction.receiver && (
          <div className="flex items-center justify-between border-t border-green-100 pt-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiOfficeBuilding className="h-4 w-4" />
              <span>Receiver</span>
            </div>
            <span className="font-medium text-gray-900">
              {transaction.receiver}
            </span>
          </div>
        )}

        {transaction.transaction_id && (
          <div className="flex items-center justify-between border-t border-green-100 pt-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiIdentification className="h-4 w-4" />
              <span>Transaction ID</span>
            </div>
            <span className="font-mono text-xs text-gray-900">
              {transaction.transaction_id}
            </span>
          </div>
        )}

        {transaction.date && (
          <div className="flex items-center justify-between border-t border-green-100 pt-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiCalendar className="h-4 w-4" />
              <span>Date</span>
            </div>
            <span className="font-medium text-gray-900">
              {transaction.date}
            </span>
          </div>
        )}

        {transaction.status && (
          <div className="flex items-center justify-between border-t border-green-100 pt-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <HiCheck className="h-4 w-4 text-green-500" />
              <span>Status</span>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              {transaction.status}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderBatchView = () => {
    if (completedBatchResults.length === 0) return null;

    const currentBatchItem = completedBatchResults[selectedBatchIndex];

    return (
      <div className="space-y-4">
        {/* Batch Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HiCollection className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Batch Results
            </span>
          </div>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {selectedBatchIndex + 1} / {completedBatchResults.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setSelectedBatchIndex(Math.max(0, selectedBatchIndex - 1))
            }
            disabled={selectedBatchIndex === 0}
            className="flex items-center space-x-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <HiChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="max-w-[150px] truncate text-center text-xs text-gray-500">
            {currentBatchItem?.name || 'Unknown'}
          </span>

          <button
            onClick={() =>
              setSelectedBatchIndex(
                Math.min(
                  completedBatchResults.length - 1,
                  selectedBatchIndex + 1
                )
              )
            }
            disabled={selectedBatchIndex === completedBatchResults.length - 1}
            className="flex items-center space-x-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <span>Next</span>
            <HiChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Transaction Details */}
        <div>
          <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            Extracted Transaction
          </label>
          <div className="mt-2">
            {renderTransactionFields(currentBatchItem?.transaction)}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={() => handleSaveBatchItem(currentBatchItem)}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-green-700"
        >
          <HiCheck className="h-5 w-5" />
          <span>Save This Transaction</span>
        </button>
      </div>
    );
  };

  const renderSingleView = () => {
    if (!extractedData) {
      return (
        <div className="text-center">
          <HiDocumentText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Processing screenshot...</p>
        </div>
      );
    }

    if (extractedData.status === 'processing') {
      return (
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Extracting data...</p>
          <p className="mt-1 text-xs text-gray-400">
            OCR + Local AI analyzing screenshot
          </p>
        </div>
      );
    }

    if (extractedData.status === 'error') {
      return (
        <div className="text-center">
          <HiExclamation className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-2 text-sm text-red-600">Extraction failed</p>
          <p className="mt-1 text-xs text-gray-500">{extractedData.error}</p>
        </div>
      );
    }

    if (extractedData.status === 'completed' && extractedData.transaction) {
      return (
        <div className="space-y-4">
          <div className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            💻 Local AI (Ollama)
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              Extracted Transaction
            </label>
            <div className="mt-2">
              {renderTransactionFields(extractedData.transaction)}
            </div>
          </div>

          {extractedData.data?.ocr_text && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium tracking-wider text-gray-500 uppercase">
                Raw OCR Text
              </summary>
              <div className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                <p className="text-xs whitespace-pre-wrap text-gray-600">
                  {extractedData.data.ocr_text}
                </p>
              </div>
            </details>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <aside className="flex w-96 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
          {showingBatch ? 'Batch Review' : 'Extracted Data'}
        </h2>
      </div>

      <div className="flex flex-1 overflow-y-auto p-4">
        <div className="w-full">
          {!showingSingle && !showingBatch ? (
            <EmptyState
              icon={HiPhotograph}
              description="Upload a screenshot to extract data"
              iconSize="medium"
            />
          ) : showingBatch ? (
            renderBatchView()
          ) : (
            renderSingleView()
          )}
        </div>
      </div>

      {/* Footer - Only show for single extraction */}
      {showingSingle && (
        <div className="space-y-2 border-t border-gray-200 p-4">
          <button
            onClick={handleSaveSingle}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!extractedData?.transaction}
          >
            <HiCheck className="h-5 w-5" />
            <span>Approve & Save</span>
          </button>

          <button
            onClick={removeScreenshot}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <span>Discard</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default RightPanel;
