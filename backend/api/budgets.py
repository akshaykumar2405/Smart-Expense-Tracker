from fastapi import APIRouter, HTTPException, Depends
from backend.models import Budget
from backend.database import get_db, init_user_db
from backend.api.auth import get_current_user_dependency
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.post("/set")
def set_budget(budget: Budget, current_user = Depends(get_current_user_dependency)):
    """Set monthly budget for a category"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Check if budget exists for category
        cur.execute("SELECT id FROM budgets WHERE category = ?", (budget.category,))
        existing = cur.fetchone()
        
        if existing:
            cur.execute(
                "UPDATE budgets SET monthly_budget = ? WHERE category = ?",
                (budget.monthly_budget, budget.category)
            )
        else:
            cur.execute(
                "INSERT INTO budgets (category, monthly_budget) VALUES (?, ?)",
                (budget.category, budget.monthly_budget)
            )
        
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Budget set for {budget.category}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
def get_budgets(current_user = Depends(get_current_user_dependency)):
    """Get all budgets"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT category, monthly_budget FROM budgets")
        budgets = cur.fetchall()
        
        # Calculate current spending for each budget
        current_month = datetime.now().strftime('%Y-%m')
        cur.execute("""
            SELECT category, SUM(amount) as total 
            FROM expenses 
            WHERE date LIKE ? 
            GROUP BY category
        """, (f"{current_month}%",))
        spending_rows = cur.fetchall()
        
        conn.close()
        
        spending = {}
        for row in spending_rows:
            spending[row[0]] = row[1]
        
        result = []
        for budget in budgets:
            spent = spending.get(budget[0], 0)
            budget_amount = budget[1]
            remaining = max(0, budget_amount - spent)
            percentage = min(100, (spent / budget_amount * 100) if budget_amount > 0 else 0)
            
            result.append({
                "category": budget[0],
                "budget": budget_amount,
                "spent": spent,
                "remaining": remaining,
                "percentage": round(percentage, 1),
                "status": "over" if spent > budget_amount else "under"
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/delete/{category}")
def delete_budget(category: str, current_user = Depends(get_current_user_dependency)):
    """Delete a budget"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("DELETE FROM budgets WHERE category = ?", (category,))
        affected_rows = cur.rowcount
        conn.commit()
        conn.close()
        
        if affected_rows == 0:
            raise HTTPException(status_code=404, detail=f"No budget found for {category}")
        
        return {"status": "success", "message": f"Budget for {category} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))