"""
Export & Known Names Routes
CSV export and known names management endpoints.
"""
import os
import json
import csv
import io
import logging
from flask import Blueprint, request, jsonify, Response

logger = logging.getLogger(__name__)

export_bp = Blueprint('export', __name__)

db_engine = None
ai_engine = None
known_names_path = None


def init_export_routes(db, ai, names_path):
    """Initialize route dependencies."""
    global db_engine, ai_engine, known_names_path
    db_engine = db
    ai_engine = ai
    known_names_path = names_path


@export_bp.route('/export', methods=['GET'])
def export_transactions():
    """Export all transactions as a CSV file."""
    try:
        format_type = request.args.get('format', 'csv')
        transactions = db_engine.get_all_transactions(limit=10000)

        if format_type == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)

            writer.writerow([
                'Date', 'Bank', 'Amount', 'Sender', 'Receiver',
                'Transaction ID', 'Consumer Number', 'Fee', 'Status', 'Source File'
            ])

            for t in transactions:
                tid = str(t.get('transaction_id', ''))
                cn = str(t.get('consumer_number', ''))

                writer.writerow([
                    t.get('date', ''),
                    t.get('bank', ''),
                    t.get('amount', 0),
                    t.get('sender', ''),
                    t.get('receiver', ''),
                    f"'{tid}",
                    f"'{cn}",
                    t.get('fee', 0),
                    t.get('status', ''),
                    t.get('source_file', '')
                ])

            output.seek(0)

            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment;filename=transactions.csv'}
            )

        return jsonify({
            'success': True,
            'transactions': transactions,
            'count': len(transactions)
        })

    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@export_bp.route('/known-names', methods=['GET'])
def get_known_names():
    """Load known sender/receiver names from JSON file."""
    try:
        if os.path.exists(known_names_path):
            with open(known_names_path, 'r', encoding='utf-8') as f:
                names = json.load(f)
            return jsonify({'success': True, 'names': names})
        return jsonify({'success': True, 'names': {'senders': [], 'receivers': []}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@export_bp.route('/known-names', methods=['POST'])
def update_known_names():
    """Save known sender/receiver names to JSON file and reload in AI engine."""
    try:
        data = request.get_json()
        names = data.get('names', {'senders': [], 'receivers': []})

        with open(known_names_path, 'w', encoding='utf-8') as f:
            json.dump(names, f, indent=2, ensure_ascii=False)

        if ai_engine:
            ai_engine.known_names = names

        logger.info(f"Known names updated: {len(names.get('senders', []))} senders, {len(names.get('receivers', []))} receivers")
        return jsonify({'success': True, 'message': 'Names saved'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500