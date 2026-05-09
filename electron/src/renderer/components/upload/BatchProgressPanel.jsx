import React from 'react';
import { HiCheckCircle, HiXCircle, HiClock, HiSparkles, HiPlay, HiStop } from 'react-icons/hi';
import { useAppContext } from '../../context/AppContext';

const BatchProgressPanel = () => {
  const { 
    batchQueue, 
    batchProgress, 
    isProcessing, 
    processBatch, 
    approveAllBatch, 
    clearBatchQueue 
  } = useAppContext();

  if (batchQueue.length === 0) return null;

  const completedCount = batchQueue.filter(f => f.status === 'completed').length;
  const errorCount = batchQueue.filter(f => f.status === 'error').length;
  const allDone = batchQueue.every(f => f.status === 'completed' || f.status === 'error');

  const handleStartProcessing = () => {
    console.log('Starting batch processing...');
    processBatch();
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Batch Queue
        </h3>
        <span className="text-xs text-gray-500">
          {batchQueue.length} files
        </span>
      </div>

      {/* Progress Bar - Only show when processing */}
      {isProcessing && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center space-x-4 mb-3 text-xs">
        {completedCount > 0 && (
          <span className="flex items-center space-x-1 text-green-600">
            <HiCheckCircle className="h-4 w-4" />
            <span>{completedCount} done</span>
          </span>
        )}
        {errorCount > 0 && (
          <span className="flex items-center space-x-1 text-red-600">
            <HiXCircle className="h-4 w-4" />
            <span>{errorCount} failed</span>
          </span>
        )}
        {isProcessing && (
          <span className="flex items-center space-x-1 text-blue-600">
            <HiSparkles className="h-4 w-4 animate-pulse" />
            <span>Processing {batchProgress.current}/{batchProgress.total}...</span>
          </span>
        )}
      </div>

      {/* File List */}
      <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
        {batchQueue.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-xs ${
              item.status === 'completed' ? 'bg-green-50' :
              item.status === 'error' ? 'bg-red-50' :
              item.status === 'processing' ? 'bg-blue-50' :
              'bg-gray-50'
            }`}
          >
            <span className="truncate flex-1 text-gray-700">{item.name}</span>
            <span className="ml-2 shrink-0">
              {item.status === 'completed' && <HiCheckCircle className="h-4 w-4 text-green-500" />}
              {item.status === 'error' && <HiXCircle className="h-4 w-4 text-red-500" />}
              {item.status === 'processing' && <HiSparkles className="h-4 w-4 animate-spin text-blue-500" />}
              {item.status === 'pending' && <HiClock className="h-4 w-4 text-gray-400" />}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {!isProcessing && !allDone && (
          <button
            onClick={handleStartProcessing}
            className="flex flex-1 items-center justify-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <HiPlay className="h-4 w-4" />
            <span>Start Processing ({batchQueue.filter(f => f.status === 'pending').length})</span>
          </button>
        )}
        
        {allDone && completedCount > 0 && (
          <button
            onClick={approveAllBatch}
            className="flex flex-1 items-center justify-center space-x-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
          >
            <HiCheckCircle className="h-4 w-4" />
            <span>Save All ({completedCount})</span>
          </button>
        )}
        
        {!isProcessing && (
          <button
            onClick={clearBatchQueue}
            className="flex items-center justify-center space-x-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <HiStop className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BatchProgressPanel;