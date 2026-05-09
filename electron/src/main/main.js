const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'AI Transaction Extraction Assistant',
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Helper function to make HTTP request to OCR server
function sendToOCRServer(imagePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const fileData = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    const fileExt = path.extname(imagePath).toLowerCase();
    
    // Determine content type based on extension
    const contentTypeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };
    const contentType = contentTypeMap[fileExt] || 'image/png';
    
    // Build multipart form data
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([
      Buffer.from(header),
      fileData,
      Buffer.from(footer),
    ]);
    
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/extract-text',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse OCR server response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`OCR server connection failed: ${error.message}`));
    });
    
    req.write(body);
    req.end();
  });
}

// IPC Handlers
ipcMain.handle('extract-text', async (event, imagePath) => {
  try {
    console.log('Extracting text from:', imagePath);
    const result = await sendToOCRServer(imagePath);
    return result;
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('check-ocr-health', async () => {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:5000/health', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ status: 'error', message: 'Invalid response' });
        }
      });
    });
    
    req.on('error', () => {
      resolve({ status: 'error', message: 'OCR server not running' });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ status: 'error', message: 'Connection timeout' });
    });
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});