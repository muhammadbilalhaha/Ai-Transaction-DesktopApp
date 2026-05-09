const OCR_SERVER_URL = 'http://127.0.0.1:5000';

export const ocrService = {
  async checkHealth() {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'error', message: 'OCR server not running' };
    }
  },

  async extractAll(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${OCR_SERVER_URL}/extract-all`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to connect to OCR server.' };
    }
  },

  // NEW: Database methods
  async saveTransaction(transaction, screenshotPath = null) {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/save-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: transaction,
          screenshot_path: screenshotPath,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to save transaction.' };
    }
  },

  async getTransactions(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await fetch(`${OCR_SERVER_URL}/transactions?${params}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to get transactions.' };
    }
  },

  async getStats() {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/transactions/stats`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to get stats.' };
    }
  },

  async deleteTransaction(id) {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/transactions/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to delete transaction.' };
    }
  },

  async exportCSV() {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/export?format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        return { success: true };
      }
      return { success: false, error: 'Export failed' };
    } catch (error) {
      return { success: false, error: 'Export failed' };
    }
  },
   // Known Names API
  async getKnownNames() {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/known-names`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to load known names' };
    }
  },

  async updateKnownNames(names) {
    try {
      const response = await fetch(`${OCR_SERVER_URL}/known-names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to save known names' };
    }
  },
};