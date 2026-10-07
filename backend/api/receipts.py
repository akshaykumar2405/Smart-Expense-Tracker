from fastapi import APIRouter, Depends
from backend.models import ReceiptScan
from backend.database import get_db, init_user_db
from backend.utils import extract_text_from_image, parse_receipt_text
from backend.api.auth import get_current_user_dependency
import logging
import base64

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/receipts", tags=["receipts"])

@router.post("/scan")
async def scan_receipt(scan: ReceiptScan, current_user = Depends(get_current_user_dependency)):
    """Scan receipt image and extract expense details"""
    try:
        # Decode base64 image
        if ',' in scan.image_base64:
            image_data = base64.b64decode(scan.image_base64.split(',')[1])
        else:
            image_data = base64.b64decode(scan.image_base64)
        
        # Extract text using OCR
        text = extract_text_from_image(image_data)
        
        # Parse receipt text
        extracted = parse_receipt_text(text, scan.category_hint)
        
        # Store in database
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO expenses (date, category, amount, description, receipt_image) 
               VALUES (?, ?, ?, ?, ?)""",
            (extracted["date"], extracted["category"], extracted["amount"], 
             f"Receipt scan: {extracted['vendor']}", 
             scan.image_base64[:100] + "..." if len(scan.image_base64) > 100 else scan.image_base64)
        )
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "extracted": extracted,
            "text_preview": text[:100] + "..." if len(text) > 100 else text
        }
    except Exception as e:
        logger.error(f"Receipt scan error: {e}")
        return {"status": "error", "message": str(e)}