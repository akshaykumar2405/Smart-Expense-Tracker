from fastapi import APIRouter, Depends
from backend.database import get_db, init_user_db
from backend.api.auth import get_current_user_dependency
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(current_user = Depends(get_current_user_dependency)):
    """Get comprehensive dashboard statistics"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Total expenses
        cur.execute("SELECT IFNULL(SUM(amount), 0) FROM expenses")  # cspell:disable-line
        total_expenses = cur.fetchone()[0]
        
        # This month
        current_month = datetime.now().strftime('%Y-%m')
        cur.execute("SELECT IFNULL(SUM(amount), 0) FROM expenses WHERE date LIKE ?", (f"{current_month}%",))  # cspell:disable-line
        month_expenses = cur.fetchone()[0]
        
        # Categories count
        cur.execute("SELECT COUNT(DISTINCT category) FROM expenses")
        category_count = cur.fetchone()[0]
        
        # Recent transactions (last 7 days)
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        cur.execute("SELECT COUNT(*) FROM expenses WHERE date >= ?", (week_ago,))
        recent_count = cur.fetchone()[0]
        
        # Budget status
        cur.execute("SELECT COUNT(*) FROM budgets")
        budget_count = cur.fetchone()[0]
        
        # Savings goals
        cur.execute("SELECT COUNT(*) FROM savings_goals")
        goals_count = cur.fetchone()[0]
        
        # Achievements
        cur.execute("SELECT COUNT(*) FROM achievements")
        achievements_count = cur.fetchone()[0]
        
        conn.close()
        
        return {
            "total_expenses": float(total_expenses) if total_expenses else 0.0,
            "month_expenses": float(month_expenses) if month_expenses else 0.0,
            "category_count": category_count,
            "recent_count": recent_count,
            "budget_count": budget_count,
            "goals_count": goals_count,
            "achievements_count": achievements_count
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return {
            "total_expenses": 0.0,
            "month_expenses": 0.0,
            "category_count": 0,
            "recent_count": 0,
            "budget_count": 0,
            "goals_count": 0,
            "achievements_count": 0
        }