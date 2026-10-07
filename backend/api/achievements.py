from fastapi import APIRouter, Depends
from backend.database import get_db, init_user_db
from backend.api.auth import get_current_user_dependency
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.get("/all")
def get_achievements(current_user = Depends(get_current_user_dependency)):
    """Get user achievements"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT badge_name, badge_type, earned_at FROM achievements ORDER BY earned_at DESC")
        rows = cur.fetchall()
        conn.close()
        
        # Map badge names to titles
        badge_titles = {
            "tracking_streak_7": {"title": "7-Day Tracking Streak", "icon": "🔥", "desc": "Tracked expenses for 7 days"},
            "first_expense": {"title": "Getting Started", "icon": "🎯", "desc": "Added your first expense"},
            "big_spender": {"title": "Active Tracker", "icon": "📊", "desc": "Tracked 10+ expenses"},
            "category_explorer": {"title": "Category Explorer", "icon": "🗂️", "desc": "Used 5+ different categories"},
            "high_value": {"title": "Big Purchase", "icon": "💎", "desc": "Tracked expense over ₹5,000"},
            "budget_master": {"title": "Budget Master", "icon": "💰", "desc": "Stayed under all budgets"},
            "super_saver": {"title": "Super Saver", "icon": "🏆", "desc": "Saved 20%+ of income"},
            "receipt_pro": {"title": "Receipt Pro", "icon": "📸", "desc": "Scanned 5+ receipts"}
        }
        
        result = []
        for row in rows:
            badge_name = row[0]
            info = badge_titles.get(badge_name, {"title": badge_name, "icon": "🏅", "desc": "Achievement earned"})
            
            result.append({
                "badge_name": badge_name,
                "badge_type": row[1],
                "title": info["title"],
                "icon": info["icon"],
                "description": info["desc"],
                "earned_at": row[2]
            })
        
        return {
            "earned": result,
            "new": []
        }
    except Exception as e:
        logger.error(f"Error getting achievements: {e}")
        return {"earned": [], "new": []}

@router.post("/test-award")
def test_award_achievement(current_user = Depends(get_current_user_dependency)):
    """Test endpoint to award a sample achievement"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Check if test achievement already exists
        cur.execute("SELECT badge_name FROM achievements WHERE badge_name = 'first_expense'")
        if cur.fetchone():
            conn.close()
            return {"message": "Test achievement already awarded"}
        
        # Award test achievement
        cur.execute("""
            INSERT INTO achievements (badge_name, badge_type, earned_at)
            VALUES ('first_expense', 'milestone', CURRENT_TIMESTAMP)
        """)
        conn.commit()
        conn.close()
        
        return {"message": "Test achievement awarded successfully"}
    except Exception as e:
        logger.error(f"Error awarding test achievement: {e}")
        return {"error": str(e)}