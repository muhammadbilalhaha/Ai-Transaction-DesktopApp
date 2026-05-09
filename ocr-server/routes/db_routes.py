"""
Database Routes
CRUD operations for saved transactions.
"""
import logging
import traceback
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)

db_bp = Blueprint('database', __name__)

db_engine = None


def init_db_routes(db):
    """Initialize database reference."""
    global db_engine
    db_engine = db


@db_bp.route('/save-transaction', methods=['POST'])
def save_transaction():
    """Save an approved transaction to the database."""
    try:
        data = request.get_json()

        if not data or 'transaction' not in data:
            return jsonify({'success': False, 'error': 'No transaction data'}), 400

        transaction = data['transaction']
        screenshot_path = data.get('screenshot_path', None)

        logger.info(f"Saving: {transaction.get('bank')} - Rs. {transaction.get('amount')}")

        # Duplicate check
        tid = transaction.get('transaction_id', '')
        amount = transaction.get('amount', 0)
        date = transaction.get('date', '')

        if tid and db_engine.is_duplicate(str(tid), amount, date):
            logger.warning(f"Duplicate prevented: {tid}")
            return jsonify({
                'success': False,
                'error': 'DUPLICATE',
                'message': 'This transaction already exists.'
            }), 409

        # Save screenshot if provided
        saved_screenshot = None
        if screenshot_path:
            saved_screenshot = db_engine.save_screenshot(
                screenshot_path, transaction.get('id', 'unknown')
            )

        # Persist to database
        trans_id = db_engine.save_transaction(transaction, saved_screenshot)

        if trans_id == 'DUPLICATE':
            return jsonify({
                'success': False,
                'error': 'DUPLICATE',
                'message': 'Duplicate prevented by database constraint.'
            }), 409
        elif trans_id:
            logger.info(f"Transaction saved: {trans_id}")
            return jsonify({
                'success': True,
                'message': 'Transaction saved successfully',
                'id': trans_id
            })
        else:
            return jsonify({'success': False, 'error': 'Database error'}), 500

    except Exception as e:
        logger.error(f"Save failed: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@db_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Retrieve transactions with optional search filters."""
    try:
        query = request.args.get('query', None)
        bank = request.args.get('bank', None)
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        limit = int(request.args.get('limit', 100))

        logger.info(f"Fetching transactions - limit: {limit}, query: {query}")

        if any([query, bank, start_date, end_date]):
            transactions = db_engine.search_transactions(
                query, bank, start_date, end_date, limit
            )
        else:
            transactions = db_engine.get_all_transactions(limit)

        return jsonify({
            'success': True,
            'transactions': transactions,
            'count': len(transactions)
        })

    except Exception as e:
        logger.error(f"Fetch failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@db_bp.route('/transactions/stats', methods=['GET'])
def get_stats():
    """Get summary statistics for all transactions."""
    try:
        stats = db_engine.get_stats()
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        logger.error(f"Stats failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@db_bp.route('/transactions/<trans_id>', methods=['DELETE'])
def delete_transaction(trans_id):
    """Delete a single transaction by ID."""
    try:
        db_engine.delete_transaction(trans_id)
        logger.info(f"Transaction deleted: {trans_id}")
        return jsonify({'success': True, 'message': 'Transaction deleted'})
    except Exception as e:
        logger.error(f"Delete failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500