import React, { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/layouts/Header';
import MainLayout from './components/layouts/MainLayout';
import { ocrService } from './services/ocrService';

const App = () => {
  useEffect(() => {
    // Check OCR server health on startup
    ocrService.checkHealth().then((result) => {
      console.log('OCR Server Status:', result);
    });
  }, []);

  return (
    <AppProvider>
      <div className="flex h-screen flex-col bg-gray-50">
        <Header />
        <MainLayout />
      </div>
    </AppProvider>
  );
};

export default App;
