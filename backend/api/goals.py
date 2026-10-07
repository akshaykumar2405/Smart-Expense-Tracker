# backend/api/goals.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import get_db, init_user_db
from backend.api.auth import get_current_user_dependency
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# Define the request models
class SavingsGoal(BaseModel):
    name: str
    target_amount: float
    current_amount: Optional[float] = 0
    deadline: Optional[str] = None

class UpdateGoal(BaseModel):
    current_amount: float

# Create router
router = APIRouter(prefix="/goals", tags=["goals"])

@router.post("/add")
def add_savings_goal(goal: SavingsGoal, current_user = Depends(get_current_user_dependency)):
    """Add a new savings goal"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO savings_goals (name, target_amount, current_amount, deadline) 
               VALUES (?, ?, ?, ?)""",
            (goal.name, goal.target_amount, goal.current_amount, goal.deadline)
        )
        conn.commit()
        goal_id = cur.lastrowid  # cspell:disable-line
        conn.close()
        
        logger.info(f"Added savings goal for user {current_user.user_id}: {goal.name} - Target: {goal.target_amount}")
        return {
            "status": "success", 
            "message": "Savings goal added",
            "goal_id": goal_id
        }
    except Exception as e:
        logger.error(f"Error adding savings goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
def get_savings_goals(current_user = Depends(get_current_user_dependency)):
    """Get all savings goals"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("SELECT id, name, target_amount, current_amount, deadline FROM savings_goals")
        goals = cur.fetchall()
        conn.close()
        
        if not goals:
            return []
        
        result = []
        for goal in goals:
            try:
                target = float(goal[2])
                current = float(goal[3])
                percentage = (current / target * 100) if target > 0 else 0
                
                days_left = None
                deadline_date = None
                
                if goal[4]:
                    try:
                        deadline_date = datetime.strptime(goal[4], '%Y-%m-%d')
                        today = datetime.now()
                        days_left = (deadline_date - today).days
                        if days_left < 0:
                            days_left = 0
                    except Exception as date_error:
                        logger.warning(f"Error parsing deadline for goal {goal[0]}: {date_error}")
                        days_left = None
                
                needed_per_day = 0
                if days_left and days_left > 0 and current < target:
                    needed_per_day = round((target - current) / days_left, 2)
                
                result.append({
                    "id": goal[0],
                    "name": goal[1],
                    "target": target,
                    "current": current,
                    "percentage": round(percentage, 1),
                    "days_left": days_left,
                    "needed_per_day": needed_per_day,
                    "deadline": goal[4] if goal[4] else None
                })
            except Exception as e:
                logger.error(f"Error processing goal {goal[0]}: {e}")
                continue
        
        return result
    except Exception as e:
        logger.error(f"Error getting savings goals: {e}")
        return []

@router.post("/update/{goal_id}")
def update_savings_goal(goal_id: int, update: UpdateGoal, current_user = Depends(get_current_user_dependency)):
    """Update savings goal progress"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Check if goal exists
        cur.execute("SELECT id FROM savings_goals WHERE id = ?", (goal_id,))
        existing = cur.fetchone()
        
        if not existing:
            conn.close()
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Update the goal
        cur.execute(
            "UPDATE savings_goals SET current_amount = ? WHERE id = ?",
            (update.current_amount, goal_id)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Updated goal {goal_id} for user {current_user.user_id} with current amount: {update.current_amount}")
        return {
            "status": "success", 
            "message": "Goal updated successfully",
            "goal_id": goal_id,
            "current_amount": update.current_amount
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating goal {goal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-custom/{goal_id}")
def update_goal_custom(goal_id: int, update: UpdateGoal, current_user = Depends(get_current_user_dependency)):
    """Update goal with custom amount (for adding/deducting)"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Get current goal
        cur.execute("SELECT current_amount FROM savings_goals WHERE id = ?", (goal_id,))
        result = cur.fetchone()
        
        if not result:
            conn.close()
            raise HTTPException(status_code=404, detail="Goal not found")
        
        current_amount = float(result[0])
        new_amount = max(0, update.current_amount)  # Ensure not negative
        
        # Update the goal
        cur.execute(
            "UPDATE savings_goals SET current_amount = ? WHERE id = ?",
            (new_amount, goal_id)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Updated goal {goal_id} for user {current_user.user_id}: {current_amount} -> {new_amount}")
        return {
            "status": "success", 
            "message": "Goal updated successfully",
            "goal_id": goal_id,
            "previous_amount": current_amount,
            "new_amount": new_amount
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating goal {goal_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{goal_id}")
def delete_goal(goal_id: int, current_user = Depends(get_current_user_dependency)):
    """Delete a savings goal"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Check if goal exists
        cur.execute("SELECT name FROM savings_goals WHERE id = ?", (goal_id,))
        goal = cur.fetchone()
        
        if not goal:
            conn.close()
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Delete the goal
        cur.execute("DELETE FROM savings_goals WHERE id = ?", (goal_id,))
        affected_rows = cur.rowcount
        conn.commit()
        conn.close()
        
        if affected_rows == 0:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        logger.info(f"Deleted goal ID: {goal_id} for user {current_user.user_id} - Name: {goal[0]}")
        return {
            "status": "success",
            "message": f"Goal '{goal[0]}' deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_goals_stats(current_user = Depends(get_current_user_dependency)):
    """Get statistics about savings goals"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        
        # Get total goals
        cur.execute("SELECT COUNT(*) FROM savings_goals")
        total_goals = cur.fetchone()[0]
        
        # Get completed goals
        cur.execute("""
            SELECT COUNT(*) FROM savings_goals 
            WHERE current_amount >= target_amount
        """)
        completed_goals = cur.fetchone()[0]
        
        # Get total target and current amounts
        cur.execute("""
            SELECT 
                SUM(target_amount) as total_target,
                SUM(current_amount) as total_current
            FROM savings_goals
        """)
        totals = cur.fetchone()
        
        conn.close()
        
        total_target = float(totals[0]) if totals[0] else 0
        total_current = float(totals[1]) if totals[1] else 0
        overall_percentage = (total_current / total_target * 100) if total_target > 0 else 0
        
        return {
            "total_goals": total_goals,
            "completed_goals": completed_goals,
            "total_target": total_target,
            "total_current": total_current,
            "overall_percentage": round(overall_percentage, 1),
            "remaining_amount": total_target - total_current
        }
    except Exception as e:
        logger.error(f"Error getting goals stats: {e}")
        return {
            "total_goals": 0,
            "completed_goals": 0,
            "total_target": 0,
            "total_current": 0,
            "overall_percentage": 0,
            "remaining_amount": 0
        }