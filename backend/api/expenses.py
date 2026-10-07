# backend/api/expenses.py - UPDATED (add user dependency)
from fastapi import APIRouter, HTTPException, Depends
from backend.models import Expense, NaturalLanguageQuery
from backend.database import get_db, init_user_db
from backend.utils import parse_natural_language_query
from backend.api.auth import get_current_user_dependency
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/add")
def add_expense(exp: Expense, current_user = Depends(get_current_user_dependency)):
    """Add a new expense"""
    try:
        # Initialize user database if not exists
        init_user_db(current_user.user_id)
        
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO expenses (date, category, amount, description, is_recurring) 
               VALUES (?,?,?,?,?)""",
            (exp.date, exp.category, exp.amount, exp.description, 1 if exp.is_recurring else 0)
        )
        conn.commit()
        
        # Get all expenses for achievement checking
        cur.execute("SELECT id, date, category, amount, description FROM expenses ORDER BY date DESC")
        rows = cur.fetchall()
        expenses = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        
        conn.close()
        
        # Check and award achievements
        from backend.utils import check_and_award_achievements
        new_achievements = check_and_award_achievements(expenses, current_user.user_id)
        
        logger.info(f"Added expense for user {current_user.user_id}: {exp.category} - ₹{exp.amount}")
        
        response = {"status": "success", "message": "Expense added successfully"}
        if new_achievements:
            response["new_achievements"] = new_achievements
            
        return response
    except Exception as e:
        logger.error(f"Error adding expense: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add expense: {str(e)}")

@router.get("/all")
def get_expenses(current_user = Depends(get_current_user_dependency)):
    """Get all expenses sorted by date (newest first)"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, date, category, amount, description, is_recurring
            FROM expenses
            ORDER BY date DESC
        """)
        rows = cur.fetchall()
        conn.close()
        
        # Convert to list of lists for compatibility with frontend
        data = []
        for row in rows:
            data.append([
                row[0],  # id
                row[1],  # date
                row[2],  # category
                float(row[3]),  # amount
                row[4] if row[4] else "",  # description
                row[5] if len(row) > 5 else 0  # is_recurring
            ])
        return data
    except Exception as e:
        logger.error(f"Error getting expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/total")
def total_expense():
    """Get total of all expenses"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT IFNULL(SUM(amount), 0) FROM expenses")  # cspell:disable-line
        total = cur.fetchone()[0]
        conn.close()
        return {"total_expense": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/category-summary")
def category_summary():
    """Get summary of expenses by category"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT category, SUM(amount) as total
            FROM expenses
            GROUP BY category
            ORDER BY total DESC
        """)
        data = cur.fetchall()
        conn.close()
        return [[row[0], row[1]] for row in data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent/{limit}")
def recent_expenses(limit: int = 10):
    """Get recent expenses with limit"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, date, category, amount, description
            FROM expenses
            ORDER BY date DESC
            LIMIT ?
        """, (limit,))
        data = cur.fetchall()
        conn.close()
        return [[row[0], row[1], row[2], row[3], row[4]] for row in data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{expense_id}")
def delete_expense(expense_id: int, current_user = Depends(get_current_user_dependency)):
    """Delete an expense by ID"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        affected_rows = cur.rowcount
        conn.commit()
        conn.close()
        
        if affected_rows == 0:
            raise HTTPException(status_code=404, detail=f"Expense with ID {expense_id} not found")
        
        logger.info(f"Deleted expense ID: {expense_id} for user {current_user.user_id}")
        return {"status": "success", "message": f"Expense {expense_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting expense: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete expense: {str(e)}")

@router.post("/natural-language-search")
def natural_language_search(query: NaturalLanguageQuery, current_user = Depends(get_current_user_dependency)):
    """Search expenses using natural language"""
    try:
        filters = parse_natural_language_query(query.query)
        
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Build SQL query
        sql = "SELECT * FROM expenses WHERE 1=1"
        params = []
        
        if filters["category"]:
            sql += " AND category = ?"
            params.append(filters["category"])
        
        if filters["min_amount"]:
            sql += " AND amount >= ?"
            params.append(filters["min_amount"])
        
        if filters["max_amount"]:
            sql += " AND amount <= ?"
            params.append(filters["max_amount"])
        
        # Date filtering
        if filters["time_period"]:
            today = datetime.now()
            if filters["time_period"] == "today":
                date_str = today.strftime('%Y-%m-%d')
                sql += " AND date = ?"
                params.append(date_str)
            elif filters["time_period"] == "yesterday":
                yesterday = today - timedelta(days=1)
                date_str = yesterday.strftime('%Y-%m-%d')
                sql += " AND date = ?"
                params.append(date_str)
            elif filters["time_period"] == "week":
                week_ago = today - timedelta(days=7)
                sql += " AND date >= ?"
                params.append(week_ago.strftime('%Y-%m-%d'))
            elif filters["time_period"] == "month":
                month_ago = today - timedelta(days=30)
                sql += " AND date >= ?"
                params.append(month_ago.strftime('%Y-%m-%d'))
        
        # Description keywords
        if filters["description_keywords"]:
            for keyword in filters["description_keywords"]:
                sql += " AND description LIKE ?"
                params.append(f"%{keyword}%")
        
        sql += " ORDER BY date DESC"
        
        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()
        
        results = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        
        return {
            "query": query.query,
            "filters": filters,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error in natural language search: {e}")
        return {
            "query": query.query,
            "filters": {},
            "results": [],
            "count": 0
        }
        
        
@router.put("/update/{expense_id}")
def update_expense(expense_id: int, exp: Expense):
    """Update an existing expense"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """UPDATE expenses 
               SET date = ?, category = ?, amount = ?, description = ?, is_recurring = ?
               WHERE id = ?""",
            (exp.date, exp.category, exp.amount, exp.description, 1 if exp.is_recurring else 0, expense_id)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Updated expense ID {expense_id}: {exp.category} - ₹{exp.amount}")
        return {"status": "success", "message": "Expense updated successfully"}
    except Exception as e:
        logger.error(f"Error updating expense: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update expense: {str(e)}")