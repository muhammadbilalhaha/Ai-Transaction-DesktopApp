import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { ocrService } from '../services/ocrService';
import { loadNamesFromBackend } from '../utils/nameMatcher';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentScreenshot, setCurrentScreenshot] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  // Batch processing state
  const [batchQueue, setBatchQueue] = useState([]); // Files waiting to process
  const [batchResults, setBatchResults] = useState([]); // Processed results
  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1); // Current processing index
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

useEffect(() => {
    loadTransactions();
    loadNamesFromBackend(); 
}, []);

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const result = await ocrService.getTransactions({ limit: 50 });
      if (result.success && result.transactions) {
        setTransactions(result.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const addScreenshot = useCallback((file) => {
    const previewUrl = URL.createObjectURL(file);
    const screenshot = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: previewUrl,
      uploadedAt: new Date().toISOString(),
    };
    setCurrentScreenshot(screenshot);
    setExtractedData(null);
    return screenshot;
  }, []);

  const removeScreenshot = useCallback(() => {
    if (currentScreenshot?.previewUrl) {
      URL.revokeObjectURL(currentScreenshot.previewUrl);
    }
    setCurrentScreenshot(null);
    setExtractedData(null);
    setIsProcessing(false);
  }, [currentScreenshot, setIsProcessing]);

  const updateExtractedData = useCallback((data) => {
    setExtractedData(data);
  }, []);

  const addTransaction = useCallback((transaction) => {
    setTransactions((prev) => [
      {
        id: transaction.id || crypto.randomUUID(),
        ...transaction,
        created_at: transaction.created_at || new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  // BATCH OPERATIONS
  const addFilesToBatch = useCallback((files) => {
    const newFiles = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      status: 'pending', // pending, processing, completed, error
      result: null,
      error: null,
    }));
    setBatchQueue((prev) => [...prev, ...newFiles]);
  }, []);

  const removeBatchItem = useCallback((id) => {
    setBatchQueue((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearBatchQueue = useCallback(() => {
    batchQueue.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setBatchQueue([]);
    setBatchResults([]);
    setCurrentBatchIndex(-1);
    setBatchProgress({ current: 0, total: 0 });
  }, [batchQueue]);

  const processBatch = useCallback(async () => {
    const currentQueue = batchQueue.filter((f) => f.status === 'pending');

    if (currentQueue.length === 0) {
      console.log('No pending files to process');
      return;
    }

    console.log(`Starting batch processing for ${currentQueue.length} files`);
    setIsProcessing(true);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: currentQueue.length });

    const results = [];

    for (let i = 0; i < currentQueue.length; i++) {
      const item = currentQueue[i];
      setCurrentBatchIndex(i);
      setBatchProgress({ current: i + 1, total: currentQueue.length });

      console.log(`Processing ${i + 1}/${currentQueue.length}: ${item.name}`);

      // Update item status to processing
      setBatchQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'processing' } : f))
      );

      try {
        const result = await ocrService.extractAll(item.file);

        console.log(`Result for ${item.name}:`, result?.success);

        if (result.success && result.transaction) {
          results.push({
            ...item,
            status: 'completed',
            result: result,
            transaction: result.transaction,
          });
          setBatchQueue((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: 'completed' } : f
            )
          );
        } else {
          results.push({
            ...item,
            status: 'error',
            error: result.error || 'Extraction failed',
          });
          setBatchQueue((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'error',
                    error: result.error || 'Extraction failed',
                  }
                : f
            )
          );
        }
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error);
        results.push({
          ...item,
          status: 'error',
          error: error.message,
        });
        setBatchQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        );
      }
    }

    console.log(
      `Batch complete. ${results.filter((r) => r.status === 'completed').length} succeeded, ${results.filter((r) => r.status === 'error').length} failed`
    );
    setBatchResults(results);
    setCurrentBatchIndex(-1);
    setIsProcessing(false);
  }, [batchQueue]);

  const approveAllBatch = useCallback(async () => {
    const completedResults = batchResults.filter(
      (r) => r.status === 'completed' && r.transaction
    );

    for (const result of completedResults) {
      try {
        await ocrService.saveTransaction(result.transaction);
        addTransaction(result.transaction);
      } catch (error) {
        console.error('Failed to save:', error);
      }
    }

    clearBatchQueue();
  }, [batchResults, addTransaction, clearBatchQueue]);

  const value = {
    currentScreenshot,
    transactions,
    isProcessing,
    extractedData,
    isLoadingTransactions,
    // Batch
    batchQueue,
    batchResults,
    currentBatchIndex,
    batchProgress,
    addScreenshot,
    removeScreenshot,
    updateExtractedData,
    addTransaction,
    setIsProcessing,
    loadTransactions,
    // Batch actions
    addFilesToBatch,
    removeBatchItem,
    clearBatchQueue,
    processBatch,
    approveAllBatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
