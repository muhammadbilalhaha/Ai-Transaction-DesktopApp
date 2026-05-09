import sqlite3
import os
import json
import shutil
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = 'transactions.db'
SCREENSHOTS_DIR = 'screenshots'

class Database:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self._ensure_dirs()
        self._create_tables()
        logger.info(f"Database initialized at {db_path}")
    
    def _ensure_dirs(self):
        """Create screenshots directory if not exists"""
        if not os.path.exists(SCREENSHOTS_DIR):
            os.makedirs(SCREENSHOTS_DIR)
    
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _create_tables(self):
        """Create tables if they don't exist"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                bank TEXT,
                amount REAL,
                sender TEXT,
                receiver TEXT,
                transaction_id TEXT,
                date TEXT,
                time TEXT,
                payment_method TEXT,
                consumer_number TEXT,
                fee REAL DEFAULT 0,
                status TEXT DEFAULT 'Successful',
                source_file TEXT,
                screenshot_path TEXT,
                notes TEXT,
                is_verified INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_transactions_date 
            ON transactions(date)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_transactions_bank 
            ON transactions(bank)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_transactions_sender 
            ON transactions(sender)
        ''')
        
        # Updated unique constraint - prevent duplicates by transaction_id + amount + date
        cursor.execute('''
            CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique 
            ON transactions(transaction_id, amount, date)
            WHERE transaction_id != '' AND transaction_id IS NOT NULL
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database tables created")
    
    def save_screenshot(self, source_path, transaction_id):
        """Save screenshot image to local storage"""
        if not source_path or not os.path.exists(source_path):
            return None
        
        ext = os.path.splitext(source_path)[1] or '.png'
        dest_filename = f"{transaction_id}{ext}"
        dest_path = os.path.join(SCREENSHOTS_DIR, dest_filename)
        
        try:
            shutil.copy2(source_path, dest_path)
            logger.info(f"Screenshot saved: {dest_path}")
            return dest_path
        except Exception as e:
            logger.error(f"Failed to save screenshot: {str(e)}")
            return None
    
    def save_transaction(self, transaction, screenshot_path=None):
        """Save transaction to database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            trans_id = transaction.get('id', datetime.now().strftime('%Y%m%d%H%M%S%f'))
            
            now = datetime.now().isoformat()
            
            # Ensure consumer_number and transaction_id are stored as TEXT to prevent scientific notation
            consumer_number = str(transaction.get('consumer_number', ''))
            transaction_id = str(transaction.get('transaction_id', ''))
            
            cursor.execute('''
                INSERT OR REPLACE INTO transactions 
                (id, bank, amount, sender, receiver, transaction_id, date, time,
                 payment_method, consumer_number, fee, status, source_file,
                 screenshot_path, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                trans_id,
                transaction.get('bank', ''),
                transaction.get('amount', 0),
                transaction.get('sender', ''),
                transaction.get('receiver', ''),
                transaction_id,
                transaction.get('date', ''),
                transaction.get('time', ''),
                transaction.get('payment_method', 'Mobile Wallet'),
                consumer_number,
                transaction.get('fee', 0),
                transaction.get('status', 'Successful'),
                transaction.get('source_file', ''),
                screenshot_path,
                transaction.get('created_at', now),
                now
            ))
            
            conn.commit()
            logger.info(f"Transaction saved: {trans_id}")
            return trans_id
            
        except sqlite3.IntegrityError as e:
            logger.warning(f"Duplicate transaction detected: {str(e)}")
            conn.rollback()
            return 'DUPLICATE'
        except Exception as e:
            logger.error(f"Failed to save transaction: {str(e)}")
            conn.rollback()
            return None
        finally:
            conn.close()
    
    def is_duplicate(self, transaction_id, amount, date):
        """Check if transaction already exists"""
        if not transaction_id:
            return False
            
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT id FROM transactions 
                WHERE transaction_id = ? AND amount = ? AND date = ?
            ''', (str(transaction_id), amount, date))
            
            result = cursor.fetchone()
            return result is not None
            
        except Exception as e:
            logger.error(f"Duplicate check failed: {str(e)}")
            return False
        finally:
            conn.close()
    
    def get_all_transactions(self, limit=100, offset=0):
        """Get all transactions"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM transactions 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        transactions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return transactions
    
    def search_transactions(self, query=None, bank=None, start_date=None, end_date=None, limit=100):
        """Search transactions with filters"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        sql = "SELECT * FROM transactions WHERE 1=1"
        params = []
        
        if query:
            sql += """ AND (sender LIKE ? OR receiver LIKE ? OR transaction_id LIKE ? OR bank LIKE ?)"""
            search_term = f"%{query}%"
            params.extend([search_term, search_term, search_term, search_term])
        
        if bank:
            sql += " AND bank = ?"
            params.append(bank)
        
        if start_date:
            sql += " AND date >= ?"
            params.append(start_date)
        
        if end_date:
            sql += " AND date <= ?"
            params.append(end_date)
        
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(sql, params)
        transactions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return transactions
    
    def get_stats(self):
        """Get transaction statistics"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(amount) as total_amount,
                COUNT(DISTINCT date) as days_with_transactions,
                COUNT(DISTINCT bank) as unique_banks,
                COUNT(DISTINCT sender) as unique_senders
            FROM transactions
        ''')
        
        stats = dict(cursor.fetchone())
        conn.close()
        return stats
    
    def delete_transaction(self, trans_id):
        """Delete a transaction"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM transactions WHERE id = ?', (trans_id,))
        conn.commit()
        conn.close()
        
        logger.info(f"Transaction deleted: {trans_id}")
        return True

db_instance = None

def get_database():
    global db_instance
    if db_instance is None:
        db_instance = Database()
    return db_instance