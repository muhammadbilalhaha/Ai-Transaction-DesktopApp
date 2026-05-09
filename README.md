# 🧾 AI Transaction Extraction

> **Automate your accounting workflow.** Drop payment screenshots → AI extracts structured transaction data → Save & Export. 100% Offline & Private.

<p align="center">
  <img src="https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
</p>

---

## About The Project

AI Transaction Extraction Assistant is a privacy-first desktop application designed for accountants, shop managers, freelancers, and business owners who handle large numbers of payment confirmations daily. The application automatically extracts structured transaction information from payment screenshots, banking app receipts, and transaction confirmations using local AI and OCR technology.

The system converts unstructured payment screenshots into organized, structured transaction records without requiring an internet connection. All data processing happens locally on the user's machine, ensuring complete privacy and security of financial information.

---

## The Problem

Accountants and business owners receive hundreds of payment confirmations daily through WhatsApp groups, personal chats, and banking apps. These confirmations come from different banks with varying layouts, fonts, languages, and screenshot styles. Currently, the process requires manually opening each screenshot, identifying important information such as bank names, transaction amounts, sender details, and transaction IDs, then manually entering this data into Excel or accounting software. This manual workflow is slow, repetitive, error-prone, and mentally exhausting, often taking hours each day.

---

## Features

### Core Features

- **Screenshot Upload** — Drag and drop, click to browse, or paste screenshots directly. Supports PNG, JPG, JPEG, and WEBP formats.

- **OCR Text Extraction** — Automatically extracts all text from uploaded screenshots using EasyOCR. Handles various banking app layouts, fonts, and formats.

- **AI Transaction Understanding** — Local AI model (Qwen 2.5 1.5B via Ollama) analyzes extracted text and identifies important information including bank names, transaction amounts, sender details, receiver information, transaction IDs, dates, and payment methods.

- **Structured Transaction Output** — Converts messy OCR text into clean, structured JSON data with fields for bank, amount, sender, receiver, transaction ID, date, time, payment method, consumer number, and fee.

- **Human Verification System** — Extracted information is displayed for user review before saving. Users can edit incorrect values and approve or reject entries to prevent accounting mistakes.

- **Database Storage** — Approved transactions are stored in a local SQLite database with all relevant information including amount, sender, bank, date, screenshot reference, transaction ID, and notes.

- **Search and Filtering** — Search transactions by bank name, amount, sender, transaction ID, or date. Filter by time periods and transaction status.

- **Excel Export** — Export all transactions to CSV format for use with accounting software and reporting tools.

### Advanced Features

- **Batch Processing** — Upload and process multiple screenshots simultaneously with queue management and progress tracking.

- **Duplicate Detection** — Automatically identifies and flags duplicate transactions based on transaction ID, amount, and date matching. Also detects duplicates without transaction IDs using bank, sender, amount, date, and receiver matching.

- **Known Names Auto-Correction** — Maintain a list of known sender and receiver names. The system automatically corrects OCR errors by matching extracted names against the known list using fuzzy string matching.

- **Premium Data Table** — View all transactions in a sortable, searchable table with pagination, alternating row colors, duplicate highlighting, and quick action buttons.

- **Transaction Details Modal** — Click any transaction to view complete details in a glass-morphism styled modal with all fields displayed.

- **Statistics Dashboard** — Real-time statistics showing total transactions, total amount processed, unique banks, and unique senders.

- **Settings Panel** — Manage known names, view database statistics, export data, and clear all records from a centralized settings interface.

### Supported Banks and Wallets

The application supports extraction from all major Pakistani banking apps and mobile wallets including EasyPaisa, JazzCash, UBL, HBL, Meezan Bank, SadaPay, NayaPay, Bank Alfalah, MCB, Allied Bank, Faysal Bank, and more.

---

## Technology Stack

### Frontend
- **Electron** — Cross-platform desktop application framework
- **React** — UI component library with hooks and context API
- **TailwindCSS** — Utility-first CSS framework for styling
- **React Icons (Heroicons)** — Premium icon library

### Backend
- **Python** — Server-side programming language
- **Flask** — Lightweight web framework for REST API
- **Flask-CORS** — Cross-origin resource sharing support

### OCR Engine
- **EasyOCR** — Deep learning-based optical character recognition
- **OpenCV** — Image preprocessing and enhancement
- **Pillow** — Python imaging library

### AI Processing
- **Ollama** — Local AI model runtime
- **Qwen 2.5 1.5B** — Lightweight language model optimized for structured extraction
- **Custom Prompt Engineering** — Specialized prompts for Pakistani banking formats

### Database
- **SQLite** — Embedded relational database
- **Custom Indexing** — Optimized indexes for fast searching and duplicate detection

### Utilities
- **python-dotenv** — Environment variable management
- **Requests** — HTTP client library

---

## Architecture

The application follows a client-server architecture where the Electron desktop app communicates with a local Python Flask server via HTTP API. The OCR processing and AI inference run entirely on the local machine with no external dependencies or cloud services.

The processing pipeline consists of four stages:

1. **Image Upload** — User uploads one or multiple screenshots through the Electron UI
2. **OCR Extraction** — The Python server uses EasyOCR to extract all text from the image
3. **AI Analysis** — Extracted text is sent to the local Ollama model which converts it to structured JSON
4. **Storage and Export** — Verified transactions are saved to SQLite and can be exported as CSV

All data remains on the local machine. No internet connection is required after initial setup and model download.

---

## Why Offline

The application is designed to be completely offline for several critical reasons:

- **Privacy** — Financial transaction data containing names, account numbers, and amounts never leaves the user's computer
- **Security** — No risk of data breaches, API key exposure, or unauthorized access
- **Reliability** — Works without internet connectivity, suitable for areas with unstable connections
- **Cost** — No API usage fees, subscription costs, or per-transaction charges
- **Speed** — No network latency, processing happens at local machine speed

---

## Use Cases

- **Accountants** processing daily WhatsApp payment confirmations from multiple clients
- **Shop Managers** tracking customer payments received through various mobile wallets
- **Freelancers** organizing client payment receipts from different banking channels
- **Business Owners** automating bookkeeping from banking app screenshots
- **Utility Bill Collectors** recording bill payments made through mobile banking

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.

---

<p align="center">
  <strong>100% Offline • 100% Private • 100% Free</strong>
</p>
