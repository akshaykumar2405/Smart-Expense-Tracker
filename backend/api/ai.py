from fastapi import APIRouter, Depends
import os
import requests
import logging
from backend.database import get_db, init_user_db
from backend.api.auth import get_current_user_dependency

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

def get_ai_suggestions(expenses):
    """Generated AI suggestions"""
    if not expenses:
        return "No expenses found. Please add some expenses to get saving tips."

    # Check API key
    api_key = os.getenv("GROQ_API_KEY")  # cspell:disable-line
    if not api_key:
        return "❌ Please set GROQ_API_KEY in your key.env file"  # cspell:disable-line

    try:
        # Format expenses
        expense_list = []
        total = 0
        category_totals = {}
        
        for e in expenses:
            date = e[1]
            category = e[2]
            amount = e[3]
            description = e[4]
            
            expense_list.append(f"• {date}: {category} - ₹{amount:.2f} ({description})")
            total += amount
            category_totals[category] = category_totals.get(category, 0) + amount
        
        expense_text = "\n".join(expense_list[:10])  # Limit to 10 expenses
        
        # Create enhanced prompt
        prompt = f"""You are a personal finance expert. Analyze these expenses and provide:
        saving tips, and suggest where I can save money based on importance.
        
        Explain in short bullet point manner, no big points. in 5-7 points only.
        Don't provide general saving suggestions, provide suggestions from data like
        if travel is with highest expense you should reply to that context.
        
    ---
    EXPENSE DATA:
    Total: ₹{total:.2f}
    Category Breakdown: {', '.join([f'{k}: ₹{v:.2f}' for k, v in category_totals.items()])}

    Recent Transactions:
    {expense_text}
    ---
    Provide specific, actionable advice. Keep response under 150 words, practical, and friendly."""

        logger.info("DEBUG: Calling Groq API with Llama 3.1...")  # cspell:disable-line
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": "You are a helpful personal finance advisor."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 500,
                "temperature": 0.7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_text = result["choices"][0]["message"]["content"]
            from backend.utils import calculate_spending_score
            spending_score = calculate_spending_score(expenses)
            return f"🤖 **AI Financial Advisor**:\n\n{ai_text}\n\n📊 **Financial Health Score: {spending_score}/100**"
        else:
            error_msg = response.text[:200]
            logger.error(f"Groq API Error {response.status_code}: {error_msg}")  # cspell:disable-line
            return get_mock_ai_suggestions(expenses, total, category_totals)
            
    except Exception as e:
        logger.error(f"Groq API Exception: {e}")  # cspell:disable-line
        return get_mock_ai_suggestions(expenses, 0, {})

def get_mock_ai_suggestions(expenses, total, category_totals):
    """Fallback mock AI suggestions"""
    if not expenses:
        return "No expenses found."
    
    from backend.utils import calculate_spending_score
    spending_score = calculate_spending_score(expenses)
    highest_cat = max(category_totals.items(), key=lambda x: x[1]) if category_totals else ("None", 0)
    
    mock_response = f"""🤖 **AI Financial Advisor**:

📊 **Financial Health Score: {spending_score}/100**

## SPENDING ANALYSIS
Total: ₹{total:.2f} across {len(expenses)} transactions.
Highest category: '{highest_cat[0]}' at ₹{highest_cat[1]:.2f}

## TOP RECOMMENDATIONS
1. **Review {highest_cat[0]} Expenses**: Optimize ₹{highest_cat[1]:.2f} spending
2. **Weekly Expense Tracking**: Review spending every Sunday
3. **30-Day Rule**: Wait 30 days for non-essential purchases over ₹500
4. **Automate Savings**: Set up automatic transfers
5. **Use Budget Planning**: Set category budgets in the app

## NEXT STEPS
• Set up budgets for top 3 categories
• Create a savings goal
• Use receipt scanner for better tracking"""
    
    return mock_response

@router.get("/suggestions")
def ai_suggestions(current_user = Depends(get_current_user_dependency)):
    """Get AI-generated saving suggestions"""
    try:
        init_user_db(current_user.user_id)
        conn = get_db(current_user.user_id)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, date, category, amount, description
            FROM expenses
            ORDER BY date DESC
            LIMIT 50
        """)
        rows = cur.fetchall()
        conn.close()
        
        expenses = [[row[0], row[1], row[2], row[3], row[4]] for row in rows]
        logger.info(f"Generating suggestions for {len(expenses)} expenses")
        advice = get_ai_suggestions(expenses)
        return {"ai_suggestions": advice}
    except Exception as e:
        logger.error(f"Error getting AI suggestions: {e}")
        return {"ai_suggestions": "Error generating suggestions. Please try again."}