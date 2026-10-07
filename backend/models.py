# backend/models.py  api data vrification
from pydantic import BaseModel, Field
from typing import Optional

class Expense(BaseModel):
    date: str
    category: str
    amount: float = Field(gt=0, description="Amount must be positive")
    description: str = ""
    is_recurring: bool = False

class Budget(BaseModel):
    category: str
    monthly_budget: float = Field(gt=0)

class SavingsGoal(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = Field(ge=0, default=0)
    deadline: Optional[str] = None

class UpdateGoal(BaseModel):
    current_amount: float

class NaturalLanguageQuery(BaseModel):
    query: str

class ReceiptScan(BaseModel):
    image_base64: str
    category_hint: Optional[str] = None

class DashboardStats(BaseModel):
    total_expenses: float
    month_expenses: float
    category_count: int
    recent_count: int
    budget_count: int
    goals_count: int
    achievements_count: int

class SpendingScore(BaseModel):
    score: float
    rating: str
    color: str
    max_score: int = 100