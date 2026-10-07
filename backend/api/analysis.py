from fastapi import APIRouter, Depends
from backend.database import get_db, init_user_db
from backend.utils import calculate_spending_score, detect_behavioral_patterns, predict_future_expenses, get_heatmap_data
from backend.api.auth import get_current_user_dependency
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.get("/heatmap")
def get_heatmap_data_api(year: int = None, month: int = None, current_user = Depends(get_current_user_dependency)):
    """Get data for calendar heatmap"""
    try:
        if not year:
            year = datetime.now().year
        if not month:
            month = datetime.now().month
        
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Get expenses for the month
        month_str = f"{year}-{month:02d}"
        cur.execute("""
            SELECT date, SUM(amount) as total 
            FROM expenses 
            WHERE date LIKE ? 
            GROUP BY date
        """, (f"{month_str}%",))
        
        daily_data = {}
        for row in cur.fetchall():
            day = int(row[0].split('-')[2])
            daily_data[day] = row[1]
        
        conn.close()
        
        # Get all expenses for heatmap generation
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT * FROM expenses")
        rows = cur.fetchall()
        conn.close()
        
        expenses = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        heatmap_result = get_heatmap_data(expenses, year, month)
        
        return heatmap_result
    except Exception as e:
        logger.error(f"Error getting heatmap data: {e}")
        import calendar
        return {
            "year": year or datetime.now().year,
            "month": month or datetime.now().month,
            "month_name": calendar.month_name[month or datetime.now().month],
            "heatmap": [],
            "max_amount": 0
        }

@router.get("/predictions")
def get_spending_predictions(months: int = 3, current_user = Depends(get_current_user_dependency)):
    """Get future spending predictions"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT * FROM expenses ORDER BY date")
        rows = cur.fetchall()
        conn.close()
        
        expenses = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        predictions = predict_future_expenses(expenses, months)
        return predictions
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        return []

@router.get("/patterns")
def get_behavioral_patterns(current_user = Depends(get_current_user_dependency)):
    """Detect behavioral spending patterns"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT * FROM expenses ORDER BY date DESC LIMIT 100")
        rows = cur.fetchall()
        conn.close()
        
        expenses = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        patterns = detect_behavioral_patterns(expenses)
        return patterns
    except Exception as e:
        logger.error(f"Error getting patterns: {e}")
        return []

@router.get("/score")
def get_spending_score(current_user = Depends(get_current_user_dependency)):
    """Calculate spending health score"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT * FROM expenses")
        rows = cur.fetchall()
        conn.close()
        
        expenses = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        score = calculate_spending_score(expenses)
        
        # Get score interpretation
        if score >= 80:
            rating = "Excellent"
            color = "#10b981"  # Green
        elif score >= 60:
            rating = "Good"
            color = "#3b82f6"  # Blue
        elif score >= 40:
            rating = "Fair"
            color = "#f59e0b"  # Yellow
        else:
            rating = "Needs Improvement"
            color = "#ef4444"  # Red
        
        return {
            "score": score,
            "rating": rating,
            "color": color,
            "max_score": 100
        }
    except Exception as e:
        logger.error(f"Error getting spending score: {e}")
        return {
            "score": 70,
            "rating": "Good",
            "color": "#3b82f6",
            "max_score": 100
        }