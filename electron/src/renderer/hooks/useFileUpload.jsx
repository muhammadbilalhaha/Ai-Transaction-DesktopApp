import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const useFileUpload = () => {
  const [error, setError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { addFilesToBatch } = useAppContext();

  const validateFile = useCallback((file) => {
    if (!file) return false;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    
    if (!ALLOWED_TYPES.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file: ${file.name}`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} is too large. Maximum size is 10MB`);
      return false;
    }

    return true;
  }, []);

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(validateFile);
    
    if (validFiles.length > 0) {
      setError(null);
      addFilesToBatch(validFiles);
    } else if (Array.from(files).length > 0) {
      // All files were invalid
      setError('No valid files selected. Please upload PNG, JPG, JPEG, or WEBP files under 10MB.');
    }
  }, [validateFile, addFilesToBatch]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isDragActive,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
    clearError,
  };
};