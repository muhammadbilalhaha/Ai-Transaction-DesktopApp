const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Send image to OCR server
  extractTextFromImage: (imagePath) => ipcRenderer.invoke('extract-text', imagePath),
  
  // Check if OCR server is running
  checkOCRHealth: () => ipcRenderer.invoke('check-ocr-health'),
  
  // General IPC methods
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onTransactionSaved: (callback) => ipcRenderer.on('transaction-saved', callback),
});