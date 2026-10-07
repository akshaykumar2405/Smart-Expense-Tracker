import re
import io
import logging  #   error and information for recored
from datetime import datetime, timedelta
from collections import defaultdict
from PIL import Image
import pytesseract  # cspell:disable-line
import numpy as np
import calendar
import os
import platform


##pridication all over  AI utilities + analysis logic
# Cross-platform Tesseract configuration  # cspell:disable-line
def configure_tesseract():  # cspell:disable-line
    """Configure Tesseract OCR path based on operating system"""  # cspell:disable-line
    system = platform.system().lower()
    
    if system == "windows":
        # Common Windows paths
        possible_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",  # cspell:disable-line
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",  # cspell:disable-line
            r"C:\Users\Sujan\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"  # cspell:disable-line
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path  # cspell:disable-line
                return
        
        # If not found, try default (might be in PATH)
        try:
            pytesseract.image_to_string(Image.new('RGB', (1, 1)))  # cspell:disable-line
        except Exception:
            logging.warning("Tesseract not found. Please install Tesseract OCR or set TESSERACT_CMD environment variable")  # cspell:disable-line
    
    elif system == "darwin":  # macOS
        # Try Homebrew path
        if os.path.exists("/opt/homebrew/bin/tesseract"):  # cspell:disable-line
            pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"  # cspell:disable-line
        elif os.path.exists("/usr/local/bin/tesseract"):  # cspell:disable-line
            pytesseract.pytesseract.tesseract_cmd = "/usr/local/bin/tesseract"  # cspell:disable-line
    
    # Linux usually has tesseract in PATH, no configuration needed  # cspell:disable-line

# Configure on import
configure_tesseract()  # cspell:disable-line

logger = logging.getLogger(__name__)

def extract_text_from_image(image_bytes):
    """Extract text from receipt image using OCR"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)  # cspell:disable-line
        return text
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        return ""

def parse_receipt_text(text, category_hint=None):
    """Parse OCR text to extract expense details"""
    # Common patterns in receipts
    amount_patterns = [
        r'TOTAL[\s:]*[\$₹€]?\s*(\d+\.?\d*)',
        r'Amount[\s:]*[\$₹€]?\s*(\d+\.?\d*)',
        r'[\$₹€]\s*(\d+\.?\d*)',
        r'(\d+\.?\d*)\s*[\$₹€]'
    ]
    
    date_patterns = [
        r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
        r'\d{4}[-/]\d{1,2}[-/]\d{1,2}'
    ]
    
    extracted = {
        "amount": 0.0,
        "date": datetime.now().strftime('%Y-%m-%d'),
        "vendor": "",
        "items": [],
        "category": "Other"
    }
    
    try:
        # Extract amount
        for pattern in amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Get the largest amount (usually total)
                    amounts = [float(m.replace(',', '')) for m in matches]
                    extracted["amount"] = max(amounts)
                    break
                except Exception:
                    pass
        
        # Extract date
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                extracted["date"] = match.group()
                break
        
        # Try to detect vendor/store
        lines = text.split('\n')
        for line in lines[:5]:  # Check first few lines
            if any(word in line.upper() for word in ['STORE', 'MARKET', 'RESTAURANT', 'CAFE', 'HOTEL']):
                extracted["vendor"] = line.strip()
                break
        
        # Try to detect category from text
        category_keywords = {
            'Food': ['FOOD', 'RESTAURANT', 'CAFE', 'GROCERY', 'EAT'],
            'Shopping': ['SHOP', 'MALL', 'STORE', 'CLOTH', 'FASHION'],
            'Travel': ['TRAVEL', 'FLIGHT', 'HOTEL', 'TAXI', 'UBER'],
            'Bills': ['BILL', 'ELECTRIC', 'WATER', 'INTERNET', 'PHONE'],
            'Entertainment': ['MOVIE', 'CINEMA', 'CONCERT', 'GAME']
        }
        
        if category_hint:
            extracted["category"] = category_hint
        else:
            for cat, keywords in category_keywords.items():
                if any(keyword in text.upper() for keyword in keywords):
                    extracted["category"] = cat
                    break
        
    except Exception as e:
        logger.error(f"Error parsing receipt: {e}")
    
    return extracted

def parse_natural_language_query(query):
    """Parse natural language queries like 'food over ₹500 last week'"""
    query = query.lower()
    
    # Initialize filters
    filters = {
        "category": None,
        "min_amount": None,
        "max_amount": None,
        "time_period": None,
        "date_range": None,
        "description_keywords": []
    }
    
    try:
        # Extract category
        category_keywords = {
            'Food': ['food', 'restaurant', 'grocery', 'eat', 'dining'],
            'Travel': ['travel', 'flight', 'taxi', 'uber', 'hotel'],
            'Shopping': ['shop', 'shopping', 'mall', 'store'],
            'Bills': ['bill', 'electricity', 'water', 'internet'],
            'Entertainment': ['movie', 'cinema', 'game', 'entertainment']
        }
        
        for cat, keywords in category_keywords.items():
            if any(keyword in query for keyword in keywords):
                filters["category"] = cat
                break
        
        # Extract amount range
        amount_patterns = [
            r'over\s*[₹$]?\s*(\d+)',
            r'more than\s*[₹$]?\s*(\d+)',
            r'above\s*[₹$]?\s*(\d+)',
            r'under\s*[₹$]?\s*(\d+)',
            r'less than\s*[₹$]?\s*(\d+)',
            r'below\s*[₹$]?\s*(\d+)',
            r'[₹$]?\s*(\d+)\s*to\s*[₹$]?\s*(\d+)',
            r'between\s*[₹$]?\s*(\d+)\s*and\s*[₹$]?\s*(\d+)'
        ]
        
        for pattern in amount_patterns:
            matches = re.findall(pattern, query)
            if matches:
                if 'over' in query or 'more than' in query or 'above' in query:
                    filters["min_amount"] = float(matches[0])
                elif 'under' in query or 'less than' in query or 'below' in query:
                    filters["max_amount"] = float(matches[0])
                elif 'to' in query or 'between' in query:
                    if len(matches[0]) == 2:
                        filters["min_amount"] = float(matches[0][0])
                        filters["max_amount"] = float(matches[0][1])
                break
        
        # Extract time period
        time_keywords = {
            'today': ['today'],
            'yesterday': ['yesterday'],
            'week': ['week', '7 days', 'seven days'],
            'month': ['month', '30 days'],
            'year': ['year']
        }
        
        for period, keywords in time_keywords.items():
            if any(keyword in query for keyword in keywords):
                filters["time_period"] = period
                break
        
        # Extract description keywords
        common_words = set(['show', 'find', 'list', 'expense', 'expenses', 'spending', 'spent'])
        words = query.split()
        for word in words:
            if word not in common_words and len(word) > 3:
                filters["description_keywords"].append(word)
        
    except Exception as e:
        logger.error(f"Error parsing query: {e}")
    
    return filters

# Date and calculation utilities
def calculate_spending_score(expenses):
    """Calculate financial health score (0-100)"""
    if not expenses:
        return 80  # Default good score for no expenses
    
    try:
        # total = sum(e[3] for e in expenses)  # Removed unused variable
        # count = len(expenses)  # Removed unused variable
        # avg_amount = total / count if count > 0 else 0  # Removed unused variable
        
        # Analyze categories
        category_totals = defaultdict(float)
        for e in expenses:
            category = e[2]
            amount = e[3]
            category_totals[category] += amount
        
        # Score factors
        score = 70  # Base score
        
        # 1. Spending consistency (lower std dev is better)
        amounts = [e[3] for e in expenses]
        if len(amounts) > 1:
            std_dev = np.std(amounts)
            if std_dev < 1000:
                score += 5
            elif std_dev > 5000:
                score -= 10
        
        # 2. Category diversity
        num_categories = len(category_totals)
        if num_categories >= 3:
            score += 5
        elif num_categories == 1:
            score -= 5
        
        # 3. Check for impulse patterns (many small expenses)
        recent_expenses = []
        for e in expenses:
            try:
                date_obj = datetime.strptime(e[1], '%Y-%m-%d')
                if (datetime.now() - date_obj).days <= 7:
                    recent_expenses.append(e)
            except Exception:
                pass
        
        if len(recent_expenses) > 10:
            score -= 8  # Too many transactions
        
        # 4. High-value expense check
        high_value = sum(1 for e in expenses if e[3] > 5000)
        if high_value > 3:
            score -= 7
        
        return max(0, min(100, score))
    except Exception as e:
        logger.error(f"Error calculating spending score: {e}")
        return 70

def detect_behavioral_patterns(expenses):
    """Detect impulse buying and other patterns"""
    patterns = []
    
    if not expenses:
        return patterns
    
    try:
        # Group by date
        daily_spending = defaultdict(float)
        for e in expenses:
            date = e[1]
            amount = e[3]
            daily_spending[date] += amount
        
        # Get recent expenses
        recent_expenses = sorted(expenses, key=lambda x: x[1], reverse=True)[:20]
        
        # Check for weekend splurging
        weekend_total = 0
        weekday_total = 0
        for e in expenses[-30:]:  # Last 30 expenses
            try:
                date_str = e[1]
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                if date_obj.weekday() >= 5:  # Weekend
                    weekend_total += e[3]
                else:
                    weekday_total += e[3]
            except Exception:
                pass
        
        if weekend_total > weekday_total * 1.5 and weekday_total > 0:
            patterns.append({
                "type": "weekend_splurging",
                "description": "You spend significantly more on weekends",
                "impact": "Medium",
                "suggestion": "Plan weekend activities with budget in mind"
            })
        
        # Detect frequent small purchases (impulse buys)
        small_purchases = [e for e in recent_expenses if e[3] < 500]
        if len(small_purchases) > 8:
            patterns.append({
                "type": "impulse_buying",
                "description": f"Many small purchases ({len(small_purchases)} under ₹500)",
                "impact": "Medium",
                "suggestion": "Use 24-hour rule for non-essential purchases under ₹500"
            })
        
        # Detect category spikes
        category_monthly = defaultdict(float)
        current_month = datetime.now().strftime('%Y-%m')
        for e in expenses:
            if e[1].startswith(current_month):
                category_monthly[e[2]] += e[3]
        
        if category_monthly:
            avg_monthly = sum(category_monthly.values()) / len(category_monthly)
            for category, amount in category_monthly.items():
                if amount > avg_monthly * 2:  # More than double average
                    patterns.append({
                        "type": "category_spike",
                        "description": f"High spending on {category} this month",
                        "impact": "Medium",
                        "suggestion": f"Review {category} expenses for optimization"
                    })
        
    except Exception as e:
        logger.error(f"Error detecting patterns: {e}")
    
    return patterns

def predict_future_expenses(expenses, months=3):
    """Predict future expenses based on historical data"""
    predictions = []
    
    if len(expenses) < 10:
        return predictions
    
    try:
        # Group by month
        monthly_totals = defaultdict(float)
        for e in expenses:
            month = e[1][:7]  # YYYY-MM
            monthly_totals[month] += e[3]
        
        # Get last 6 months
        sorted_months = sorted(monthly_totals.keys())[-6:]
        if len(sorted_months) < 3:
            return predictions
        
        amounts = [monthly_totals[m] for m in sorted_months]
        
        # Simple moving average prediction
        for i in range(1, months + 1):
            # Weighted average (more weight to recent months)
            weights = [0.1, 0.2, 0.3, 0.4][:len(amounts)]
            weights = [w/sum(weights) for w in weights]  # Normalize
            predicted = sum(a * w for a, w in zip(amounts[-len(weights):], weights))
            
            # Add 5% inflation/mo
            predicted *= (1.05 ** i)
            
            next_month = datetime.now() + timedelta(days=30*i)
            predictions.append({
                "month": next_month.strftime("%Y-%m"),
                "predicted_amount": round(predicted, 2),
                "confidence": "medium" if len(amounts) >= 4 else "low"
            })
        
    except Exception as e:
        logger.error(f"Error predicting expenses: {e}")
    
    return predictions

def check_and_award_achievements(expenses, user_id):
    """Check and award achievements based on spending patterns"""
    try:
        from backend.database import get_db, init_user_db
        
        # Initialize user database
        init_user_db(user_id)
        conn = get_db(user_id)
        cur = conn.cursor()
        
        achievements = []
        
        # Check existing achievements
        cur.execute("SELECT badge_name FROM achievements")
        existing = [row[0] for row in cur.fetchall()]
        
        # 1. Consistency Badge (7 days of tracking)
        recent_dates = set()
        for e in expenses[-30:]:  # Check last 30 expenses
            recent_dates.add(e[1])
        
        if len(recent_dates) >= 7 and "tracking_streak_7" not in existing:
            achievements.append({
                "badge_name": "tracking_streak_7",
                "badge_type": "consistency",
                "title": "7-Day Tracking Streak",
                "description": "Tracked expenses for 7 consecutive days",
                "icon": "🔥"
            })
        
        # 2. First Expense Badge
        if len(expenses) >= 1 and "first_expense" not in existing:
            achievements.append({
                "badge_name": "first_expense",
                "badge_type": "milestone",
                "title": "Getting Started",
                "description": "Added your first expense",
                "icon": "🎯"
            })
        
        # 3. Big Spender Badge (10+ expenses)
        if len(expenses) >= 10 and "big_spender" not in existing:
            achievements.append({
                "badge_name": "big_spender",
                "badge_type": "milestone",
                "title": "Active Tracker",
                "description": "Tracked 10+ expenses",
                "icon": "📊"
            })
        
        # 4. Category Explorer (5+ different categories)
        categories = set(e[2] for e in expenses)
        if len(categories) >= 5 and "category_explorer" not in existing:
            achievements.append({
                "badge_name": "category_explorer",
                "badge_type": "diversity",
                "title": "Category Explorer",
                "description": "Used 5+ different expense categories",
                "icon": "🗂️"
            })
        
        # 5. High Value Tracker (expense over ₹5000)
        high_value_expenses = [e for e in expenses if e[3] >= 5000]
        if len(high_value_expenses) >= 1 and "high_value" not in existing:
            achievements.append({
                "badge_name": "high_value",
                "badge_type": "milestone",
                "title": "Big Purchase",
                "description": "Tracked an expense over ₹5,000",
                "icon": "💎"
            })
        
        # Save new achievements
        for achievement in achievements:
            cur.execute("""
                INSERT INTO achievements (badge_name, badge_type, earned_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (achievement["badge_name"], achievement["badge_type"]))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Awarded {len(achievements)} new achievements to user {user_id}")
        return achievements
    except Exception as e:
        logger.error(f"Error checking achievements: {e}")
        return []

def get_heatmap_data(expenses, year=None, month=None):
    """Get data for calendar heatmap"""
    if not year:
        year = datetime.now().year
    if not month:
        month = datetime.now().month
    
    # Get expenses for the month
    month_str = f"{year}-{month:02d}"
    daily_data = {}
    
    for expense in expenses:
        date = expense[1]
        if date.startswith(month_str):
            day = int(date.split('-')[2])
            daily_data[day] = daily_data.get(day, 0) + expense[3]
    
    # Generate calendar data
    cal = calendar.monthcalendar(year, month)
    heatmap_data = []
    
    for week in cal:
        week_data = []
        for day in week:
            if day == 0:
                week_data.append({"day": None, "amount": 0, "has_data": False})
            else:
                amount = daily_data.get(day, 0)
                week_data.append({
                    "day": day,
                    "amount": amount,
                    "has_data": amount > 0
                })
        heatmap_data.append(week_data)
    
    max_amount = max(daily_data.values()) if daily_data else 0
    
    return {
        "year": year,
        "month": month,
        "month_name": calendar.month_name[month],
        "heatmap": heatmap_data,
        "max_amount": max_amount
    }