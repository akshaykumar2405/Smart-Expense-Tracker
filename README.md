<div align="center">

# 💰 Smart Expense Tracker

### AI-Powered Financial Management Made Simple

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Contributing](#-contributing)

---

### 🎯 Track. Analyze. Save. Repeat.

*Your personal AI financial assistant that helps you understand spending patterns, set budgets, and achieve financial goals.*

</div>

---

## 🌟 Why Smart Expense Tracker?

<table>
<tr>
<td width="33%" align="center">
<img src="https://img.icons8.com/fluency/96/artificial-intelligence.png" width="64"/>
<h3>🤖 AI-Powered</h3>
<p>Get intelligent insights and predictions powered by Groq AI (Llama 3.1)</p>
</td>
<td width="33%" align="center">
<img src="https://img.icons8.com/fluency/96/dashboard.png" width="64"/>
<h3>📊 Beautiful Dashboard</h3>
<p>Interactive charts and visualizations with real-time updates</p>
</td>
<td width="33%" align="center">
<img src="https://img.icons8.com/fluency/96/security-checked.png" width="64"/>
<h3>🔒 Secure & Private</h3>
<p>Your data stays local with user-specific encrypted databases</p>
</td>
</tr>
</table>

---

## ✨ Features

### 💳 Core Features
- **Smart Expense Tracking** - Add, edit, and categorize expenses with ease
- **Budget Planning** - Set monthly budgets with real-time progress tracking
- **Savings Goals** - Create and monitor financial goals with visual progress
- **Receipt Scanning** - OCR-powered receipt processing (Tesseract)

### 🤖 AI-Powered Intelligence
- **Financial Insights** - Get personalized spending recommendations
- **Spending Predictions** - AI forecasts your future expenses
- **Pattern Detection** - Automatically identify spending habits
- **Smart Tips** - Receive actionable financial advice

### 📊 Analytics & Visualization
- **Spending Heatmap** - Calendar view of daily spending patterns
- **Interactive Charts** - Multiple chart types (bar, line, pie, doughnut)
- **Behavior Analysis** - Deep dive into your financial behavior
- **Trend Analysis** - Weekly, monthly, and yearly spending trends

### 🎮 Gamification
- **Achievement System** - Earn badges for financial milestones
- **Spending Score** - Track your financial health score
- **Progress Tracking** - Visual indicators for all goals

### 🔍 Advanced Features
- **Natural Language Search** - Find expenses using plain English
- **Multi-Category Support** - 10+ expense categories
- **Data Export** - Export your data anytime
- **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🎬 Demo

### Dashboard Overview
```
┌─────────────────────────────────────────────────────────────┐
│  💰 Total Expenses: $2,450    📊 Budget Used: 65%          │
│  🎯 Active Goals: 3           🏆 Achievements: 12           │
└─────────────────────────────────────────────────────────────┘
```

### AI Insights Example
> 💡 **AI Suggestion**: You've spent 30% more on dining this month. Consider cooking at home 2-3 times per week to save $200/month.

---

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/sujankakadiya/Smart-Expense-Tracker.git
cd Smart-Expense-Tracker

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
cp key.env.example key.env
# Edit key.env with your API keys

# 4. Start the backend server
python run_server.py

# 5. In a new terminal, start the frontend
python serve_frontend.py

# 6. Open your browser
# Frontend: http://localhost:3000/login.html
# API Docs: http://127.0.0.1:8000/docs
```

### 🔑 API Keys Setup

Edit `key.env` file:

```env
# Required for AI features (Get from: https://console.groq.com/)
GROQ_API_KEY=your_groq_api_key_here

# Required for authentication
JWT_SECRET_KEY=your_secret_key_here

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 💻 Usage

### First Time Setup

1. **Create Account**
   - Navigate to http://localhost:3000/signup.html
   - Fill in your details
   - Click "Sign Up"

2. **Login**
   - Go to http://localhost:3000/login.html
   - Enter credentials
   - Access your dashboard

3. **Add Your First Expense**
   - Click "Add Expense" on dashboard
   - Fill in amount, category, and description
   - Submit

4. **Set a Budget**
   - Go to "Budget Planning" tab
   - Choose category and set monthly limit
   - Track progress in real-time

5. **Create a Goal**
   - Navigate to "Savings Goals"
   - Set target amount and deadline
   - Update progress as you save

---

## 🏗️ Project Structure

```
Smart-Expense-Tracker/
├── 📁 backend/
│   ├── 📁 api/              # API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── expenses.py      # Expense management
│   │   ├── budgets.py       # Budget planning
│   │   ├── goals.py         # Savings goals
│   │   ├── ai.py            # AI insights
│   │   ├── analysis.py      # Analytics
│   │   ├── achievements.py  # Gamification
│   │   ├── dashboard.py     # Dashboard stats
│   │   └── receipts.py      # Receipt scanning
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database management
│   ├── models.py            # Data models
│   ├── auth.py              # Auth logic
│   └── utils.py             # Utilities
├── 📁 frontend/
│   ├── index.html           # Main dashboard
│   ├── login.html           # Login page
│   ├── signup.html          # Signup page
│   ├── style.css            # Styles
│   └── 📁 js/
│       ├── script.js        # Main logic
│       └── login.js         # Auth logic
├── 📁 data/                 # User databases (auto-created)
├── 📁 .github/workflows/    # CI/CD pipelines
├── .gitignore               # Git ignore rules
├── key.env.example          # Environment template
├── requirements.txt         # Python dependencies
├── LICENSE                  # MIT License
└── README.md               # This file
```

---

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create new account |
| POST | `/auth/login` | Login user |
| POST | `/auth/google` | Google OAuth login |

### Expense Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses/all` | Get all expenses |
| POST | `/expenses/add` | Add new expense |
| PUT | `/expenses/{id}` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense |
| GET | `/expenses/search` | Natural language search |

### Budget & Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/budgets/all` | Get all budgets |
| POST | `/budgets/add` | Create budget |
| GET | `/goals/all` | Get all goals |
| POST | `/goals/add` | Create goal |
| PUT | `/goals/{id}/update` | Update goal progress |

### AI & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/suggestions` | Get AI suggestions |
| GET | `/ai/tips` | Get financial tips |
| GET | `/ai/forecast` | Get spending forecast |
| GET | `/analysis/heatmap` | Get spending heatmap |
| GET | `/analysis/patterns` | Detect patterns |
| GET | `/analysis/predictions` | Get predictions |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard statistics |
| GET | `/achievements/all` | Get all achievements |

**📖 Full API Documentation:** http://127.0.0.1:8000/docs (when server is running)

---

## 🛠️ Technology Stack

<div align="center">

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

### AI & Tools
![Groq](https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge)
![Tesseract](https://img.shields.io/badge/Tesseract_OCR-4285F4?style=for-the-badge)

</div>

---

## 🧪 Testing

Run backend tests:
```bash
python test_backend.py
```

Expected output:
```
✓ Main app imported successfully
✓ Database module imported successfully
✓ Auth module imported successfully
✓ All API modules imported successfully
✓ Models imported successfully
✓ Utils imported successfully
✅ All tests passed!
```

---

## 🔒 Security Features

- 🔐 **Password Hashing** - Bcrypt encryption
- 🎫 **JWT Authentication** - Secure token-based auth
- 🗄️ **Database Isolation** - User-specific databases
- 🛡️ **CORS Protection** - Configurable CORS policies
- ✅ **Input Validation** - Pydantic models
- 🔑 **API Key Protection** - Environment variables

---

## 📊 Screenshots

### Dashboard
> Add your screenshot here: `![Dashboard](screenshots/dashboard.png)`

### Budget Planning
> Add your screenshot here: `![Budget](screenshots/budget.png)`

### AI Insights
> Add your screenshot here: `![AI](screenshots/ai.png)`

---

## 🗺️ Roadmap

- [ ] 📱 Mobile app (React Native)
- [ ] 📧 Email notifications
- [ ] 💱 Multi-currency support
- [ ] 🔄 Recurring expenses
- [ ] 🏦 Bank integration
- [ ] 📤 Data export (CSV/PDF)
- [ ] 🌙 Dark mode
- [ ] 🌍 Multi-language support
- [ ] 👥 Family budget sharing
- [ ] 📈 Investment tracking

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🎉 Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use meaningful variable names
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2024 Smart Expense Tracker
```

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [Groq](https://groq.com/) - AI capabilities
- [Tesseract](https://github.com/tesseract-ocr/tesseract) - OCR engine
- All contributors and users of this project

---

## 📞 Support & Contact

- 🐛 **Bug Reports**: [Open an issue](https://github.com/sujankakadiya/Smart-Expense-Tracker/issues)
- 💡 **Feature Requests**: [Open an issue](https://github.com/sujankakadiya/Smart-Expense-Tracker/issues)
- 📧 **Email**: your.email@example.com
- 🌐 **Website**: your-website.com

---

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star! ⭐

[![GitHub stars](https://img.shields.io/github/stars/sujankakadiya/Smart-Expense-Tracker?style=social)](https://github.com/sujankakadiya/Smart-Expense-Tracker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sujankakadiya/Smart-Expense-Tracker?style=social)](https://github.com/sujankakadiya/Smart-Expense-Tracker/network/members)

---

<div align="center">

### 💰 Made with ❤️ for better financial management

**[⬆ Back to Top](#-smart-expense-tracker)**

</div>
# Smart-Expense-Tracker
