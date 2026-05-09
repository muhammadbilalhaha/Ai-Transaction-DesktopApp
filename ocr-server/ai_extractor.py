import json
import re
import os
import logging
import ollama

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIExtractor:
    def __init__(self):
        self.model = 'qwen2.5:1.5b'
        self.known_names_path = os.path.join(os.path.dirname(__file__), 'known_names.json')
        self.known_names = self._load_known_names()
        logger.info(f"AI Extractor initialized with model: {self.model}")
        logger.info(f"Known names loaded: {len(self.known_names.get('senders', []))} senders, {len(self.known_names.get('receivers', []))} receivers")
    
    def _load_known_names(self):
        """Load known names from JSON file"""
        try:
            if os.path.exists(self.known_names_path):
                with open(self.known_names_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load known names: {str(e)}")
        return {'senders': [], 'receivers': []}
    
    def _save_known_names(self):
        """Save known names to JSON file (called when Electron updates them)"""
        try:
            with open(self.known_names_path, 'w', encoding='utf-8') as f:
                json.dump(self.known_names, f, indent=2, ensure_ascii=False)
            logger.info("Known names saved")
        except Exception as e:
            logger.error(f"Failed to save known names: {str(e)}")
    
    def _string_similarity(self, s1, s2):
        """Calculate similarity between two strings (0 to 1)"""
        if s1 == s2:
            return 1.0
        if len(s1) < 2 or len(s2) < 2:
            return 0.0
        
        # Check if one contains the other
        if s1 in s2 or s2 in s1:
            return 0.9
        
        # Count matching bigrams
        def get_bigrams(s):
            return set(s[i:i+2] for i in range(len(s)-1))
        
        b1 = get_bigrams(s1)
        b2 = get_bigrams(s2)
        
        if not b1 or not b2:
            return 0.0
        
        intersection = b1 & b2
        union = b1 | b2
        
        return len(intersection) / len(union) if union else 0.0
    
    def _correct_name(self, name, name_list, threshold=0.65):
        """Find best matching name from known list"""
        if not name or len(name) < 3 or not name_list:
            return name
        
        name_lower = name.lower().strip()
        
        best_match = None
        best_score = 0.0
        
        for known in name_list:
            known_lower = known.lower().strip()
            
            # Exact match
            if name_lower == known_lower:
                return known
            
            # Calculate similarity
            score = self._string_similarity(name_lower, known_lower)
            
            # Bonus for same first letter
            if name_lower and known_lower and name_lower[0] == known_lower[0]:
                score += 0.1
            
            # Bonus for same first word
            name_first = name_lower.split()[0] if name_lower.split() else ''
            known_first = known_lower.split()[0] if known_lower.split() else ''
            if name_first and known_first and name_first == known_first:
                score += 0.15
            
            if score > best_score:
                best_score = score
                best_match = known
        
        if best_match and best_score >= threshold:
            logger.info(f"Auto-corrected name: '{name}' → '{best_match}' (confidence: {best_score:.0%})")
            return best_match
        
        return name
    
    def _correct_names(self, result):
        """Auto-correct sender and receiver using known names"""
        try:
            # Correct sender
            sender = result.get('sender', '')
            if sender and self.known_names.get('senders'):
                corrected = self._correct_name(sender, self.known_names['senders'])
                if corrected != sender:
                    result['sender'] = corrected
                    result['sender_corrected'] = True
            
            # Correct receiver
            receiver = result.get('receiver', '')
            if receiver and self.known_names.get('receivers'):
                corrected = self._correct_name(receiver, self.known_names['receivers'])
                if corrected != receiver:
                    result['receiver'] = corrected
                    result['receiver_corrected'] = True
                    
        except Exception as e:
            logger.warning(f"Name correction failed: {str(e)}")
        
        return result
    
    def extract_transaction(self, ocr_text, image_filename=""):
        try:
            detected_bank = self._detect_bank_from_text(ocr_text)
            
            prompt = self._build_prompt(ocr_text, detected_bank)
            
            logger.info(f"Pre-detected bank: {detected_bank}")
            logger.info("Sending to Qwen 2.5 for extraction...")
            
            for attempt in range(2):
                response = ollama.generate(
                    model=self.model,
                    prompt=prompt,
                    format='json',
                    options={
                        'temperature': 0.0,
                        'num_predict': 400,
                    }
                )
                
                logger.info(f"Raw AI response: {response['response'][:500]}")
                
                try:
                    result = json.loads(response['response'])
                    result = self._clean_result(result, ocr_text, detected_bank)
                    result = self._correct_names(result)  # AUTO-CORRECT NAMES
                    result['source_file'] = image_filename
                    
                    logger.info(f"Final extraction: {json.dumps(result, indent=2)}")
                    
                    return {
                        'success': True,
                        'transaction': result
                    }
                    
                except json.JSONDecodeError:
                    raw = response.get('response', '')
                    json_match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
                    if json_match:
                        try:
                            result = json.loads(json_match.group())
                            result = self._clean_result(result, ocr_text, detected_bank)
                            result = self._correct_names(result)  # AUTO-CORRECT NAMES
                            return {'success': True, 'transaction': result}
                        except:
                            pass
            
            logger.warning("AI failed, using regex fallback")
            result = self._regex_fallback(ocr_text, detected_bank, image_filename)
            result = self._correct_names(result)  # AUTO-CORRECT NAMES
            return {'success': True, 'transaction': result}
            
        except Exception as e:
            logger.error(f"AI extraction failed: {str(e)}")
            result = self._regex_fallback(ocr_text, '', image_filename)
            return {'success': True, 'transaction': result}
    
    def _detect_bank_from_text(self, text):
        text_lower = text.lower()
        
        bank_keywords = {
            'easypaisa': 'EasyPaisa',
            'jazzcash': 'JazzCash',
            'sadapay': 'SadaPay',
            'nayapay': 'NayaPay',
            'ubl': 'UBL',
            'ubc': 'UBL',
            'meezan': 'Meezan Bank',
            'hbl': 'HBL',
            'alfalah': 'Bank Alfalah',
            'mcb': 'MCB',
            'allied': 'Allied Bank',
            'faysal': 'Faysal Bank',
            'soneri': 'Soneri Bank',
            'standard': 'Standard Chartered',
            'habib': 'Habib Bank',
            'askari': 'Askari Bank',
            'live': 'Live',
        }
        
        for keyword, bank_name in bank_keywords.items():
            if keyword in text_lower:
                return bank_name
        
        return ''
    
    def _build_prompt(self, ocr_text, detected_bank=""):
        bank_hint = f"\nBank detected in text: {detected_bank}" if detected_bank else ""
        
        return f"""Extract transaction details from a Pakistani payment receipt OCR text.{bank_hint}

OCR TEXT:
{ocr_text}

Output this JSON structure with extracted values:
{{"bank":"","amount":0,"sender":"","receiver":"","transaction_id":"","date":"","time":"","payment_method":"Mobile Wallet","consumer_number":"","fee":0,"status":"Successful"}}

EXTRACTION RULES:

1. BANK: The payment app/bank name. If text contains "easypaisa" → "EasyPaisa", "jazzcash" → "JazzCash", "ubl" or "ubc" → "UBL", "hbl" → "HBL", "meezan" → "Meezan Bank".

2. AMOUNT: The TOTAL AMOUNT paid. Look for "Total Amount Rs. X" or "Amount Debited Rs. X". Convert to number: "Rs. 4,089.83" → 4089.83, "Rs. 230" → 230.

3. SENDER: The PERSON who paid. Look for "Paid by [NAME]" or "From [NAME]". Example: "Paid by Muhammad Waseem" → sender: "Muhammad Waseem". Only the person's name.

4. RECEIVER: The COMPANY receiving payment. Extract ONLY the short company name.
   Valid values: "SSGC", "K-Electric", "PESCO", "IESCO", "LESCO", "SNGPL", "PTCL".
   "~Electric" or "Electric" → "K-Electric".
   "PESCO-Peshawar Electric Supply" → "PESCO".
   "SSGC Consumer Details..." → "SSGC".
   DO NOT include words like "Consumer", "Details", "Number", or any digits.
   ONLY the company acronym/name.

5. TRANSACTION_ID: Look for "ID#[NUMBER]" or "Reference Number: [NUMBER]". Example: "4D#37842761080" → "37842761080".

6. DATE: Convert to YYYY-MM-DD. "21 February 2025" → "2025-02-21", "26 June 2025" → "2025-06-26".

7. CONSUMER_NUMBER: Long number (10+ digits) after "Consumer Number" or "Consumer Details". Put in consumer_number field ONLY.

8. FEE: Any fee amount. Look for "Fee / Charge Rs. X" or "Fee Rs. X". 0 if none.

9. STATUS: Usually "Successful".

CRITICAL: 
- consumer_number and receiver are SEPARATE fields
- Numbers go in consumer_number, NEVER in receiver
- Company names go in receiver, NEVER include numbers

Return ONLY the JSON, no other text.""" 

    def _clean_result(self, result, ocr_text, detected_bank):
        if (not result.get('bank') or result['bank'] == '') and detected_bank:
            result['bank'] = detected_bank
        
        bank = result.get('bank', '').lower()
        bank_map = {
            'ubc': 'UBL', 'ubl': 'UBL',
            'easypaisa': 'EasyPaisa', 'jazzcash': 'JazzCash',
            'meezan': 'Meezan Bank', 'hbl': 'HBL',
        }
        for key, value in bank_map.items():
            if key in bank:
                result['bank'] = value
                break
        
        amount = result.get('amount', 0)
        if isinstance(amount, str):
            amount = amount.replace('Rs.', '').replace('PKR', '').replace(',', '').strip()
            try:
                result['amount'] = float(amount)
            except:
                result['amount'] = 0
        
        if not result.get('amount') or result['amount'] == 0:
            amount = self._extract_amount_from_text(ocr_text)
            if amount > 0:
                result['amount'] = amount
        
        if not result.get('sender') or result['sender'] == '':
            sender = self._extract_sender_from_text(ocr_text)
            if sender:
                result['sender'] = sender
        
        receiver = result.get('receiver', '')
        
        if receiver:
            receiver = re.sub(r'\s*Consumer\s*(Details|Number|#)?.*$', '', receiver, flags=re.IGNORECASE)
            receiver = re.sub(r'\s+\d{6,}\s*', ' ', receiver)
            receiver = re.sub(r'(SSGC)\s+\d+\s+\1', r'\1', receiver)
            receiver = re.sub(r'PESCO[\s\-]*Peshawar\s*Electric\s*Supply', 'PESCO', receiver, flags=re.IGNORECASE)
            receiver = re.sub(r'IESCO[\s\-]*Islamabad\s*Electric\s*Supply', 'IESCO', receiver, flags=re.IGNORECASE)
            receiver = re.sub(r'LESCO[\s\-]*Lahore\s*Electric\s*Supply', 'LESCO', receiver, flags=re.IGNORECASE)
            
            if re.search(r'[~]?\s*Electric', receiver, re.IGNORECASE):
                receiver = 'K-Electric'
            
            receiver = re.sub(r'\s+', ' ', receiver).strip()
            receiver = receiver.strip('- ~.,;:')
            
            if receiver.lower() in ['company', '']:
                receiver = self._extract_receiver_from_text(ocr_text)
            
            result['receiver'] = receiver if receiver else ''
        
        if not result.get('receiver') or result['receiver'].lower() in ['company', 'electric', 'consumer', '']:
            extracted_receiver = self._extract_receiver_from_text(ocr_text)
            if extracted_receiver:
                result['receiver'] = extracted_receiver
        
        if not result.get('transaction_id'):
            tid = self._extract_transaction_id_from_text(ocr_text)
            if tid:
                result['transaction_id'] = tid
        
        if not result.get('consumer_number'):
            cn = self._extract_consumer_number_from_text(ocr_text)
            if cn:
                result['consumer_number'] = cn
        
        return result
    
    def _extract_amount_from_text(self, text):
        patterns = [
            r'Total Amount.*?Rs\.\s*([\d,]+\.?\d*)',
            r'Amount\s+Debited\s+Rs\.\s*([\d,]+\.?\d*)',
            r'PKR\s*([\d,]+\.?\d*)',
            r'Rs\.\s*([\d,]+\.?\d*)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(',', ''))
        return 0
    
    def _extract_sender_from_text(self, text):
        match = re.search(r'Paid by\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)', text, re.IGNORECASE)
        if match and len(match.group(1)) > 3:
            return match.group(1).strip()
        
        match = re.search(r'From:?\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)', text, re.IGNORECASE)
        if match and len(match.group(1)) > 3:
            return match.group(1).strip()
        
        return ''
    
    def _extract_receiver_from_text(self, text):
        known = {
            'ssgc': 'SSGC',
            'k-electric': 'K-Electric',
            '~electric': 'K-Electric',
            'kelectric': 'K-Electric',
            'pesco': 'PESCO',
            'iesco': 'IESCO',
            'lesco': 'LESCO',
            'sngpl': 'SNGPL',
            'ptcl': 'PTCL',
            'ke': 'K-Electric',
        }
        
        text_lower = text.lower()
        for keyword, company in known.items():
            if keyword in text_lower:
                return company
        
        match = re.search(r'Company(?:\s+Name)?\s+([A-Za-z~\-]+)', text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if '~electric' in name.lower() or name.lower() == 'electric':
                return 'K-Electric'
            if 'ssgc' in name.lower():
                return 'SSGC'
            if 'pesco' in name.lower():
                return 'PESCO'
            return name.split()[0] if name.split() else name
        
        return ''
    
    def _extract_transaction_id_from_text(self, text):
        patterns = [
            r'ID#\s*([A-Z0-9]+)',
            r'Reference Number:\s*(\d+)',
            r'TXN\s*(\d+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).replace('#', '')
        return ''
    
    def _extract_consumer_number_from_text(self, text):
        match = re.search(r'Consumer\s+(?:Number|Details|#)\s*(\d{10,})', text, re.IGNORECASE)
        if match:
            return match.group(1)
        return ''
    
    def _regex_fallback(self, ocr_text, detected_bank, filename):
        return {
            'bank': detected_bank or self._detect_bank_from_text(ocr_text) or 'Unknown',
            'amount': self._extract_amount_from_text(ocr_text),
            'sender': self._extract_sender_from_text(ocr_text),
            'receiver': self._extract_receiver_from_text(ocr_text),
            'transaction_id': self._extract_transaction_id_from_text(ocr_text),
            'date': '',
            'time': '',
            'payment_method': 'Mobile Wallet',
            'consumer_number': self._extract_consumer_number_from_text(ocr_text),
            'fee': 0,
            'status': 'Successful',
            'source_file': filename
        }

ai_extractor = None

def get_ai_extractor():
    global ai_extractor
    if ai_extractor is None:
        ai_extractor = AIExtractor()
    return ai_extractor