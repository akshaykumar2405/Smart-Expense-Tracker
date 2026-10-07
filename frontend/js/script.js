// Configuration
const API_BASE = "http://127.0.0.1:8000";
let expenses = [];
let filteredExpenses = [];
let categoryChart = null;
let timeChart = null;
let monthlyChart = null;
let topCategoriesChart = null;
let topCategoriesBarChart = null;
let currentEditId = null;
let currentChartPeriod = 'week';
let currentHeatmapMonth = new Date().getMonth() + 1;
let currentHeatmapYear = new Date().getFullYear();
let scannedReceiptData = null;

// DOM Elements
const expenseTableBody = document.getElementById('expenseTableBody');
const totalExpensesEl = document.getElementById('totalExpenses');
const todayExpensesEl = document.getElementById('todayExpenses');
const categoryCountEl = document.getElementById('categoryCount');
const recentExpensesEl = document.getElementById('recentExpenses');
const expenseForm = document.getElementById('expenseForm');
const editExpenseForm = document.getElementById('editExpenseForm');
const editModal = document.getElementById('editModal');
const pageTitle = document.querySelector('#pageTitle');
const pageDescription = document.querySelector('#pageDescription');
const aiContentEl = document.getElementById('aiContent');
const analyzeContentEl = document.getElementById('analyzeContent');

// =========================
// THEME MANAGEMENT
// =========================
function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    html.setAttribute('data-theme', savedTheme);
    if (themeIcon) {
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// =========================
// RESPONSIVE SIDEBAR
// =========================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.toggle-sidebar i');
    
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.className = 'fas fa-chevron-right';
    } else {
        toggleBtn.className = 'fas fa-chevron-left';
    }
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (window.innerWidth <= 1024 && 
        !sidebar.contains(e.target) && 
        !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
    }
});

// =========================
// TAB MANAGEMENT
// =========================
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked menu item
    const clickedItem = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Update page title and description
    updatePageTitle(tabName);
    
    // Close mobile menu after selection
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
    
    // Load tab-specific content
    loadTabContent(tabName);
}

function updatePageTitle(tabName) {
    const titles = {
        'dashboard': { title: 'Dashboard', desc: 'Track and analyze your expenses' },
        'expenses': { title: 'Expense History', desc: 'View and manage your expense records' },
        'budget': { title: 'Budget Planning', desc: 'Set and monitor your spending budgets' },
        'goals': { title: 'Savings Goals', desc: 'Track your financial goals and progress' },
        'ai': { title: 'AI Assistant', desc: 'Get smart financial insights and tips' },
        'heatmap': { title: 'Spending Heatmap', desc: 'Visualize your spending patterns' },
        'patterns': { title: 'Behavior Analysis', desc: 'Analyze your spending behavior' },
        'visualize': { title: 'Visualize Trends', desc: 'Interactive charts and graphs' },
        'achievements': { title: 'Achievements', desc: 'Your financial milestones and badges' }
    };
    
    const tabInfo = titles[tabName] || { title: 'Dashboard', desc: 'Track and analyze your expenses' };
    
    if (pageTitle) pageTitle.textContent = tabInfo.title;
    if (pageDescription) pageDescription.textContent = tabInfo.desc;
}

function loadTabContent(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'expenses':
            loadExpenseHistory();
            break;
        case 'budget':
            loadBudgetPlanning();
            break;
        case 'goals':
            loadSavingsGoals();
            break;
        case 'ai':
            loadAIAssistant();
            break;
        case 'heatmap':
            loadSpendingHeatmap();
            break;
        case 'patterns':
            loadBehaviorAnalysis();
            break;
        case 'visualize':
            loadVisualizeTrends();
            break;
        case 'achievements':
            loadAchievements();
            loadSpendingScore();
            break;
    }
}

// Helper functions (SINGLE DEFINITIONS ONLY)
function getToken() {
    return localStorage.getItem("access_token");
}

function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "login.html";
        return {};
    }
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toFixed(2)}`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN");
}

function showNotification(message, type = "info") {
    alert(message);
}

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('access_token');
    const user_id = localStorage.getItem('user_id');
    
    if (!token || !user_id) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    window.location.href = 'login.html';
}

// Update main header with user info
function updateUserInfo() {
    const userEmail = localStorage.getItem('user_email');
    const userSection = document.getElementById('userSection');
    
    if (userSection) {
        userSection.innerHTML = `
            <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <span>${userEmail}</span>
                <button class="btn btn-logout" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
    }
}

// Category helpers
function getCategoryClass(category) {
    const classes = {
        'Food': 'food',
        'Transport': 'transport',
        'Shopping': 'shopping',
        'Entertainment': 'entertainment',
        'Bills': 'bills',
        'Healthcare': 'healthcare',
        'Education': 'education',
        'Other': 'other'
    };
    return classes[category] || 'other';
}

function getCategoryIcon(category) {
    const icons = {
        'Food': 'utensils',
        'Transport': 'car',
        'Shopping': 'shopping-bag',
        'Entertainment': 'film',
        'Bills': 'file-invoice',
        'Healthcare': 'heartbeat',
        'Education': 'graduation-cap',
        'Other': 'receipt'
    };
    return icons[category] || 'receipt';
}

// Initialize with authentication check
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    if (!checkAuthentication()) {
        return;
    }
    
    // Load theme first
    loadTheme();
    
    // Initialize UI
    updateUserInfo();
    
    // Set today's date
    setTodayDate();
    
    // Setup event listeners
    setupEventListeners();
    
    // Wait for Chart.js to be fully loaded, then initialize charts
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js is available, initializing charts...');
        initializeCharts();
    } else {
        console.log('Chart.js not ready, waiting...');
        // Wait a bit and try again
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js loaded after delay, initializing charts...');
                initializeCharts();
            } else {
                console.error('Chart.js failed to load');
                showNotification('Chart library failed to load. Some features may not work.', 'warning');
            }
        }, 1000);
    }
    
    // Load expenses and other data
    loadExpenses();
    initializeNewFeatures();
    
    // Handle responsive sidebar on window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Load dashboard by default
    loadTabContent('dashboard');
    
    console.log('Initialization complete');
});

// Handle window resize for responsive behavior
function handleWindowResize() {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth > 1024) {
        // Desktop: remove mobile classes
        sidebar.classList.remove('mobile-open');
    } else {
        // Mobile/Tablet: ensure sidebar is collapsed
        sidebar.classList.remove('collapsed');
    }
}

// Placeholder functions for tab content loading
function loadDashboard() {
    // Dashboard is already loaded, just refresh data
    loadExpenses();
}

function loadExpenseHistory() {
    // Load and display expense history
    console.log('Loading expense history...');
    
    // Load expenses first
    loadExpenses();
    
    // Setup event listeners for filters
    setupExpenseHistoryFilters();
}

function setupExpenseHistoryFilters() {
    const filterPeriod = document.getElementById('filterPeriod');
    const sortBy = document.getElementById('sortBy');
    
    if (filterPeriod) {
        filterPeriod.addEventListener('change', function() {
            filterExpensesByPeriod(this.value);
        });
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', function() {
            sortExpensesByField(this.value);
        });
    }
}

function filterExpensesByPeriod(period) {
    console.log('Filtering expenses by period:', period);
    
    if (!expenses || expenses.length === 0) {
        renderExpenses();
        return;
    }
    
    let filtered = [...expenses];
    const now = new Date();
    
    if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = expenses.filter(expense => {
            const expenseDate = new Date(expense[1]);
            return expenseDate >= weekAgo;
        });
    } else if (period === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = expenses.filter(expense => {
            const expenseDate = new Date(expense[1]);
            return expenseDate >= monthAgo;
        });
    }
    
    filteredExpenses = filtered;
    renderExpenses();
}

function sortExpensesByField(field) {
    console.log('Sorting expenses by:', field);
    
    if (!filteredExpenses || filteredExpenses.length === 0) {
        return;
    }
    
    filteredExpenses.sort((a, b) => {
        switch(field) {
            case 'date':
                return new Date(b[1]) - new Date(a[1]); // Newest first
            case 'amount':
                return b[3] - a[3]; // Highest first
            case 'category':
                return a[2].localeCompare(b[2]); // Alphabetical
            default:
                return 0;
        }
    });
    
    renderExpenses();
}

function loadBudgetPlanning() {
    // Load budget planning content
    console.log('Loading budget planning...');
    loadBudgets();
}

function loadSavingsGoals() {
    // Load savings goals content
    console.log('Loading savings goals...');
}

function loadAIAssistant() {
    // Load AI assistant content
    console.log('Loading AI assistant...');
}

function loadSpendingHeatmap() {
    // Load spending heatmap
    console.log('Loading spending heatmap...');
    loadHeatmapData();
}

function loadBehaviorAnalysis() {
    // Load behavior analysis
    console.log('Loading behavior analysis...');
}

function loadVisualizeTrends() {
    // Load visualization trends
    console.log('Loading visualization trends...');
}

function loadAchievements() {
    // Load achievements
    console.log('Loading achievements...');
}

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
        dateInput.max = today;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add expense form
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addExpense();
        });
    }

    // Edit expense form
    if (editExpenseForm) {
        editExpenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateExpense();
        });
    }
    
    // Setup expense history filters (will be called when tab is loaded)
    setTimeout(() => {
        setupExpenseHistoryFilters();
    }, 100);
}

// Initialize new features
async function initializeNewFeatures() {
    await loadBudgets();
    await loadSavingsGoals();
    await loadHeatmapData();
    await loadPatterns();
    await getPredictions();
    await loadSpendingScore();
    await loadAchievements();
    
    // Update dashboard stats
    await updateDashboardStats();
}

// Update dashboard stats
async function updateDashboardStats() {
    if (!checkAuthentication()) return;

    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        
        // Update stats cards with new data
        if (document.getElementById('totalExpenses')) {
            document.getElementById('totalExpenses').textContent = formatCurrency(data.total_expenses || 0);
        }
        if (document.getElementById('todayExpenses')) {
            document.getElementById('todayExpenses').textContent = formatCurrency(data.month_expenses || 0);
        }
        if (document.getElementById('categoryCount')) {
            document.getElementById('categoryCount').textContent = data.category_count || 0;
        }
        if (document.getElementById('recentExpenses')) {
            document.getElementById('recentExpenses').textContent = data.recent_count || 0;
        }
        
        // Add budget info if available
        if (data.budget_count > 0) {
            const budgetCard = document.querySelector('.stat-card.categories');
            if (budgetCard) {
                budgetCard.innerHTML += `<div class="trend">${data.budget_count} budgets set</div>`;
            }
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Switch between tabs - REMOVED DUPLICATE FUNCTION

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.querySelector('.toggle-sidebar i');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-right';
        } else {
            toggleIcon.className = 'fas fa-chevron-left';
        }
    }
}

// Add expense
async function addExpense() {
    if (!checkAuthentication()) return;
    
    const dateInput = document.getElementById('date');
    const categoryInput = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    
    if (!dateInput || !categoryInput || !amountInput) return;
    
    const expense = {
        date: dateInput.value,
        category: categoryInput.value,
        amount: parseFloat(amountInput.value),
        description: descriptionInput.value || ''
    };

    try {
        const response = await fetch(`${API_BASE}/expenses/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(expense)
        });

        if (response.ok) {
            const result = await response.json();
            showNotification('Expense added successfully!', 'success');
            
            // Check for new achievements
            if (result.new_achievements && result.new_achievements.length > 0) {
                setTimeout(() => {
                    result.new_achievements.forEach(achievement => {
                        showNotification(`🎉 Achievement Unlocked: ${achievement.title}!`, 'success');
                    });
                }, 1000);
            }
            
            if (expenseForm) expenseForm.reset();
            setTodayDate();
            await loadExpenses();
            await initializeNewFeatures();
        } else {
            throw new Error('Failed to add expense');
        }
    } catch (error) {
        showNotification('Error adding expense. Please try again.', 'error');
        console.error('Add expense error:', error);
    }
}

// Load expenses from API
function processExpenseData(data) {
    if (!data || !Array.isArray(data)) return [];
    
    // If data is already in the expected format [id, date, category, amount, description]
    if (data.length > 0 && Array.isArray(data[0])) {
        return data;
    }
    
    // Convert from object format to array format
    return data.map(item => {
        return [
            item.id || item[0] || 0,
            item.date || item[1] || '',
            item.category || item[2] || '',
            parseFloat(item.amount || item[3] || 0),
            item.description || item[4] || '',
            item.is_recurring || item[5] || 0
        ];
    });
}

// FIXED: loadExpenses function - only one definition
async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE}/expenses/all`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch expenses");

        const data = await response.json();
        
        // FIX: Store data in global variables
        expenses = processExpenseData(data);
        filteredExpenses = [...expenses];
        
        renderExpenses();
        updateStats();
        updateCategoryChart();
        updateTrendCharts();
    } catch (err) {
        console.error("Load expenses error:", err);
        showNotification("Error loading expenses", "error");
    }
}

// FIXED: renderExpenses function - only one definition
function renderExpenses() {
    if (!expenseTableBody) return;
    
    if (filteredExpenses.length === 0) {
        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses found.</p>
                </td>
            </tr>
        `;
        return;
    }

    expenseTableBody.innerHTML = filteredExpenses.map(expense => {
        const [id, date, category, amount, description] = expense;
        
        return `
            <tr data-id="${id}">
                <td>${formatDate(date)}</td>
                <td>
                    <span class="category-badge category-${getCategoryClass(category)}">
                        <i class="fas fa-${getCategoryIcon(category)}"></i>
                        ${category}
                    </span>
                </td>
                <td>${description || 'No description'}</td>
                <td class="amount negative">${formatCurrency(amount)}</td>
                <td class="actions">
                    <button class="action-btn edit-btn" onclick="openEditModal(${id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteExpense(${id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    // Total expenses
    const total = expenses.reduce((sum, expense) => sum + expense[3], 0);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(total);

    // Category count
    const categories = new Set(expenses.map(expense => expense[2]));
    if (categoryCountEl) categoryCountEl.textContent = categories.size;

    // Recent expenses (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = expenses.filter(expense => {
        const date = new Date(expense[1]);
        return date >= weekAgo;
    }).length;
    if (recentExpensesEl) recentExpensesEl.textContent = recent;

    // Today's expenses
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = expenses
        .filter(expense => expense[1] === today)
        .reduce((sum, expense) => sum + expense[3], 0);
    if (todayExpensesEl) todayExpensesEl.textContent = formatCurrency(todayTotal);
}

// Function to reinitialize charts if needed
function ensureChartsInitialized() {
    console.log('Checking chart initialization...');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        showNotification('Chart library not loaded. Please refresh the page.', 'error');
        return false;
    }
    
    // Check if all charts are initialized
    const chartsToCheck = [
        { name: 'categoryChart', variable: categoryChart },
        { name: 'timeChart', variable: timeChart },
        { name: 'monthlyChart', variable: monthlyChart },
        { name: 'topCategoriesChart', variable: topCategoriesChart },
        { name: 'topCategoriesBarChart', variable: topCategoriesBarChart }
    ];
    
    let needsInit = false;
    chartsToCheck.forEach(chart => {
        if (!chart.variable) {
            console.log(`${chart.name} needs initialization`);
            needsInit = true;
        }
    });
    
    if (needsInit) {
        console.log('Reinitializing charts...');
        initializeCharts();
        return true;
    }
    
    return false;
}

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts...');
    
    // Category Chart
    const ctx1 = document.getElementById('categoryChart');
    if (ctx1) {
        console.log('Creating category chart...');
        try {
            categoryChart = new Chart(ctx1.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585',
                            '#f8961e', '#7209b7', '#38b000', '#ff9e00'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { padding: 20, usePointStyle: true }
                        }
                    }
                }
            });
            console.log('Category chart created successfully');
        } catch (error) {
            console.error('Error creating category chart:', error);
        }
    } else {
        console.error('Category chart canvas not found');
    }

    // Time Chart (Week/Month/Year)
    const ctx2 = document.getElementById('timeChart');
    if (ctx2) {
        console.log('Creating time chart...');
        try {
            timeChart = new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Amount (₹)',
                        data: [],
                        backgroundColor: '#4361ee',
                        borderColor: '#3a0ca3',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1.5, // Control aspect ratio
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                callback: value => '₹' + value.toLocaleString(),
                                maxTicksLimit: 6 // Limit number of ticks
                            }
                        },
                        x: {
                            ticks: {
                                maxTicksLimit: 8 // Limit x-axis labels
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false // Hide legend to save space
                        }
                    }
                }
            });
            console.log('Time chart created successfully');
        } catch (error) {
            console.error('Error creating time chart:', error);
        }
    } else {
        console.error('Time chart canvas not found');
    }

    // Monthly Chart
    const ctx3 = document.getElementById('monthlyChart');
    if (ctx3) {
        console.log('Creating monthly chart...');
        try {
            monthlyChart = new Chart(ctx3.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Monthly Spending (₹)',
                        data: [],
                        borderColor: '#f72585',
                        backgroundColor: 'rgba(247, 37, 133, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#f72585',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4 // Smaller points
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1.5,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                callback: value => '₹' + value.toLocaleString(),
                                maxTicksLimit: 6
                            }
                        },
                        x: {
                            ticks: {
                                maxTicksLimit: 6
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            console.log('Monthly chart created successfully');
        } catch (error) {
            console.error('Error creating monthly chart:', error);
        }
    } else {
        console.error('Monthly chart canvas not found');
    }

    // Top Categories Chart (Polar Area)
    const ctx4 = document.getElementById('topCategoriesChart');
    if (ctx4) {
        console.log('Creating top categories polar chart...');
        try {
            topCategoriesChart = new Chart(ctx4.getContext('2d'), {
                type: 'polarArea',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585',
                            '#f8961e', '#7209b7', '#38b000', '#ff9e00'
                        ],
                        borderWidth: 1,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { 
                                padding: 10, 
                                usePointStyle: true,
                                font: {
                                    size: 11 // Smaller font
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            ticks: {
                                display: false // Hide radial ticks
                            }
                        }
                    }
                }
            });
            console.log('Top categories polar chart created successfully');
        } catch (error) {
            console.error('Error creating top categories polar chart:', error);
        }
    } else {
        console.error('Top categories polar chart canvas not found');
    }

    // Top Categories Bar Chart
    const ctx5 = document.getElementById('topCategoriesBarChart');
    if (ctx5) {
        console.log('Creating top categories bar chart...');
        try {
            topCategoriesBarChart = new Chart(ctx5.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Amount (₹)',
                        data: [],
                        backgroundColor: [
                            '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585',
                            '#f8961e'
                        ],
                        borderColor: [
                            '#3a0ca3', '#2a0892', '#3aa9d3', '#d1145a',
                            '#d67c0e'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1.5,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                callback: value => '₹' + value.toLocaleString(),
                                maxTicksLimit: 6
                            }
                        },
                        x: {
                            ticks: {
                                maxTicksLimit: 5
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            console.log('Top categories bar chart created successfully');
        } catch (error) {
            console.error('Error creating top categories bar chart:', error);
        }
    } else {
        console.error('Top categories bar chart canvas not found');
    }
    
    console.log('Chart initialization complete');
}

// Update category chart
function updateCategoryChart() {
    if (!categoryChart) {
        console.log('Category chart not initialized');
        return;
    }

    console.log('Updating category chart with', expenses.length, 'expenses');

    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense[2];
        const amount = expense[3];
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    console.log('Category totals:', categoryTotals);

    categoryChart.data.labels = Object.keys(categoryTotals);
    categoryChart.data.datasets[0].data = Object.values(categoryTotals);
    categoryChart.update();
}

// Update trend charts
function updateTrendCharts() {
    console.log('Updating trend charts...');
    updateTimeChart();
    updateMonthlyChart();
    updateTopCategoriesChart();
    updateTopCategoriesBarChart();
}

// Update time chart based on period
function updateTimeChart(period = currentChartPeriod) {
    if (!timeChart) {
        console.log('Time chart not initialized');
        return;
    }

    console.log('Updating time chart for period:', period);

    let labels = [];
    let data = [];

    if (period === 'week') {
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            const dayTotal = expenses
                .filter(expense => expense[1] === dateStr)
                .reduce((sum, expense) => sum + expense[3], 0);
            data.push(dayTotal);
        }
    } else if (period === 'month') {
        // Get last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.getDate());
            
            const dateStr = date.toISOString().split('T')[0];
            const dayTotal = expenses
                .filter(expense => expense[1] === dateStr)
                .reduce((sum, expense) => sum + expense[3], 0);
            data.push(dayTotal);
        }
    } else if (period === 'year') {
        // Get last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            
            const monthStr = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0');
            const monthTotal = expenses
                .filter(expense => expense[1].startsWith(monthStr))
                .reduce((sum, expense) => sum + expense[3], 0);
            data.push(monthTotal);
        }
    }

    console.log('Time chart data:', { labels, data });

    timeChart.data.labels = labels;
    timeChart.data.datasets[0].data = data;
    timeChart.update();
}

// Update monthly chart
function updateMonthlyChart() {
    if (!monthlyChart) {
        console.log('Monthly chart not initialized');
        return;
    }

    console.log('Updating monthly chart...');

    // Get last 6 months
    const months = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthYear);
        
        const monthStr = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0');
        const monthTotal = expenses
            .filter(expense => expense[1].startsWith(monthStr))
            .reduce((sum, expense) => sum + expense[3], 0);
        data.push(monthTotal);
    }

    console.log('Monthly chart data:', { months, data });

    monthlyChart.data.labels = months;
    monthlyChart.data.datasets[0].data = data;
    monthlyChart.update();
}

// Update top categories chart (polar area)
function updateTopCategoriesChart() {
    if (!topCategoriesChart) {
        console.log('Top categories polar chart not initialized');
        return;
    }

    console.log('Updating top categories polar chart...');

    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense[2];
        const amount = expense[3];
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    // Sort and get top 5
    const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    console.log('Top categories polar data:', sorted);

    topCategoriesChart.data.labels = sorted.map(item => item[0]);
    topCategoriesChart.data.datasets[0].data = sorted.map(item => item[1]);
    topCategoriesChart.update();
}

// Update top categories bar chart
function updateTopCategoriesBarChart() {
    if (!topCategoriesBarChart) {
        console.log('Top categories bar chart not initialized');
        return;
    }

    console.log('Updating top categories bar chart...');

    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense[2];
        const amount = expense[3];
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    // Sort and get top 5
    const sorted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    console.log('Top categories bar data:', sorted);

    topCategoriesBarChart.data.labels = sorted.map(item => item[0]);
    topCategoriesBarChart.data.datasets[0].data = sorted.map(item => item[1]);
    topCategoriesBarChart.update();
}

// Update chart period (Week/Month/Year)
function updateChartPeriod(period) {
    currentChartPeriod = period;
    
    console.log('Updating chart period to:', period);
    
    // Update button states
    if (document.getElementById('weekBtn')) document.getElementById('weekBtn').classList.remove('active');
    if (document.getElementById('monthBtn')) document.getElementById('monthBtn').classList.remove('active');
    if (document.getElementById('yearBtn')) document.getElementById('yearBtn').classList.remove('active');
    if (document.getElementById(period + 'Btn')) document.getElementById(period + 'Btn').classList.add('active');
    
    // Ensure charts are initialized
    if (!timeChart) {
        console.log('Time chart not initialized, initializing...');
        ensureChartsInitialized();
        setTimeout(() => updateTimeChart(period), 100);
    } else {
        // Update chart
        updateTimeChart(period);
    }
    
    showNotification(`Showing ${period}ly data`, 'info');
}

// Manual refresh function for charts
function refreshCharts() {
    console.log('Manual chart refresh requested');
    ensureChartsInitialized();
    setTimeout(() => {
        updateTrendCharts();
        updateCategoryChart();
        showNotification('Charts refreshed successfully!', 'success');
    }, 200);
}

// Filter expenses
function filterExpenses(type) {
    if (type === 'all') {
        filteredExpenses = [...expenses];
    } else if (type === 'month') {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        filteredExpenses = expenses.filter(expense => {
            const date = new Date(expense[1]);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
    }
    renderExpenses();
    showNotification(`Showing ${type} expenses`, 'info');
}

// Sort expenses
function sortExpenses() {
    const sortBy = document.getElementById('sortBy');
    if (!sortBy) return;
    
    const value = sortBy.value;
    
    filteredExpenses.sort((a, b) => {
        switch (value) {
            case 'date-desc':
                return new Date(b[1]) - new Date(a[1]);
            case 'date-asc':
                return new Date(a[1]) - new Date(b[1]);
            case 'amount-desc':
                return b[3] - a[3];
            case 'amount-asc':
                return a[3] - b[3];
            case 'category':
                return a[2].localeCompare(b[2]);
            default:
                return 0;
        }
    });
    
    renderExpenses();
}

// Open edit modal
async function openEditModal(id) {
    currentEditId = id;
    try {
        // Find expense by ID
        const expense = expenses.find(e => e[0] === id);
        if (!expense) throw new Error('Expense not found');

        // Fill form
        document.getElementById('editExpenseId').value = id;
        document.getElementById('editDate').value = expense[1];
        document.getElementById('editCategory').value = expense[2];
        document.getElementById('editAmount').value = expense[3];
        document.getElementById('editDescription').value = expense[4] || '';

        // Show modal
        if (editModal) editModal.classList.add('active');
    } catch (error) {
        showNotification('Error loading expense details', 'error');
        console.error('Open edit modal error:', error);
    }
}

// Close edit modal
function closeEditModal() {
    if (editModal) editModal.classList.remove('active');
    currentEditId = null;
    if (editExpenseForm) editExpenseForm.reset();
}

// Update expense
async function updateExpense() {
    const id = currentEditId;
    if (!id) return;
    
    const updatedExpense = {
        date: document.getElementById('editDate').value,
        category: document.getElementById('editCategory').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        description: document.getElementById('editDescription').value
    };

    try {
        const response = await fetch(`${API_BASE}/expenses/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedExpense)
        });

        if (response.ok) {
            // Delete old expense
            await deleteExpense(id);
            
            showNotification('Expense updated successfully!', 'success');
            closeEditModal();
            
            // Refresh achievements
            await loadAchievements();
        } else {
            throw new Error('Failed to update expense');
        }
    } catch (error) {
        showNotification('Error updating expense', 'error');
        console.error('Update expense error:', error);
    }
}

// Delete expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        const response = await fetch(`${API_BASE}/expenses/delete/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            // Remove from local arrays
            expenses = expenses.filter(e => e[0] !== id);
            filteredExpenses = filteredExpenses.filter(e => e[0] !== id);
            
            // Update UI
            renderExpenses();
            updateStats();
            updateCategoryChart();
            updateTrendCharts();
            
            showNotification('Expense deleted successfully!', 'success');
            
            // Refresh achievements
            await loadAchievements();
        } else {
            throw new Error('Failed to delete expense');
        }
    } catch (error) {
        showNotification('Error deleting expense', 'error');
        console.error('Delete expense error:', error);
    }
}

// Clear all expenses
async function clearAllExpenses() {
    if (!confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) return;

    try {
        // Delete each expense individually
        for (const expense of expenses) {
            await fetch(`${API_BASE}/expenses/delete/${expense[0]}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        }

        // Clear local arrays
        expenses = [];
        filteredExpenses = [];
        
        // Update UI
        renderExpenses();
        updateStats();
        updateCategoryChart();
        updateTrendCharts();
        
        showNotification('All expenses cleared successfully!', 'warning');
        
        // Refresh achievements
        await loadAchievements();
    } catch (error) {
        showNotification('Error clearing expenses', 'error');
        console.error('Clear expenses error:', error);
    }
}

// Budget Planning Functions
async function setBudget() {
    const category = document.getElementById('budgetCategory')?.value;
    const amount = parseFloat(document.getElementById('budgetAmount')?.value);
    
    console.log('Setting budget:', { category, amount });
    
    if (!category || !amount) {
        showNotification('Please select category and enter amount', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('Budget amount must be greater than 0', 'error');
        return;
    }
    
    try {
        console.log('Sending budget request to API...');
        const response = await fetch(`${API_BASE}/budgets/set`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ category, monthly_budget: amount })
        });
        
        console.log('Budget API response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Budget set successfully:', result);
            showNotification(`Budget set for ${category}: ${formatCurrency(amount)}`, 'success');
            await loadBudgets();
            
            // Clear form
            if (document.getElementById('budgetAmount')) {
                document.getElementById('budgetAmount').value = '';
            }
            if (document.getElementById('budgetCategory')) {
                document.getElementById('budgetCategory').value = '';
            }
            
            // Refresh achievements
            await loadAchievements();
        } else {
            const errorData = await response.json();
            console.error('Budget API error:', errorData);
            throw new Error(errorData.detail || 'Failed to set budget');
        }
    } catch (error) {
        console.error('Error setting budget:', error);
        showNotification('Error setting budget: ' + error.message, 'error');
    }
}

async function loadBudgets() {
    if (!checkAuthentication()) return;

    console.log('Loading budgets...');
    
    try {
        const response = await fetch(`${API_BASE}/budgets/all`, {
            headers: getAuthHeaders()
        });
        
        console.log('Budgets API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Budgets data received:', data);
        
        const budgets = Array.isArray(data) ? data : (data.budgets || data || []);
        
        const container = document.getElementById('budgetList');
        if (!container) {
            console.error('Budget list container not found');
            return;
        }
        
        if (budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <p>No budgets set yet. Set your first budget above!</p>
                    <div class="budget-tips">
                        <h5>💡 Budget Tips:</h5>
                        <ul>
                            <li>Start with essential categories like Food and Transport</li>
                            <li>Set realistic monthly limits based on your income</li>
                            <li>Review and adjust budgets monthly</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = budgets.map(budget => {
            const percentage = budget.percentage || 0;
            const isOverBudget = percentage > 100;
            
            return `
                <div class="budget-item ${isOverBudget ? 'over-budget' : ''}">
                    <div class="budget-header">
                        <span class="category-badge category-${getCategoryClass(budget.category)}">
                            <i class="fas fa-${getCategoryIcon(budget.category)}"></i>
                            ${budget.category}
                        </span>
                        <span class="amount ${isOverBudget ? 'negative' : 'positive'}">
                            ${formatCurrency(budget.spent)} / ${formatCurrency(budget.budget)}
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${isOverBudget ? '#f72585' : '#4cc9f0'};"></div>
                    </div>
                    <div class="budget-footer">
                        <span class="${isOverBudget ? 'text-danger' : ''}">${percentage.toFixed(1)}% used</span>
                        <span class="${budget.remaining < 0 ? 'text-danger' : 'text-success'}">
                            ${budget.remaining < 0 ? 'Over by ' + formatCurrency(Math.abs(budget.remaining)) : formatCurrency(budget.remaining) + ' remaining'}
                        </span>
                    </div>
                    <div class="budget-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteBudget('${budget.category}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`Loaded ${budgets.length} budgets successfully`);
        
    } catch (error) {
        console.error('Error loading budgets:', error);
        const container = document.getElementById('budgetList');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading budgets: ${error.message}</p>
                    <button class="btn btn-primary" onclick="loadBudgets()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

async function deleteBudget(category) {
    if (!confirm(`Are you sure you want to delete budget for ${category}?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/budgets/delete/${category}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showNotification(`Budget for ${category} deleted!`, 'success');
            await loadBudgets();
        } else {
            throw new Error('Failed to delete budget');
        }
    } catch (error) {
        showNotification('Error deleting budget', 'error');
        console.error('Delete budget error:', error);
    }
}

// Savings Goals Functions
async function addSavingsGoal() {
    const name = document.getElementById('goalName')?.value;
    const target = parseFloat(document.getElementById('goalTarget')?.value);
    const current = parseFloat(document.getElementById('goalCurrent')?.value) || 0;
    const deadline = document.getElementById('goalDeadline')?.value;
    
    if (!name || !target) {
        showNotification('Please enter goal name and target amount', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/goals/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                name: name,
                target_amount: target,
                current_amount: current,
                deadline: deadline || null
            })
        });
        
        if (response.ok) {
            showNotification('Savings goal added!', 'success');
            await loadSavingsGoals();
            
            // Clear form
            if (document.getElementById('goalName')) document.getElementById('goalName').value = '';
            if (document.getElementById('goalTarget')) document.getElementById('goalTarget').value = '';
            if (document.getElementById('goalCurrent')) document.getElementById('goalCurrent').value = '';
            if (document.getElementById('goalDeadline')) document.getElementById('goalDeadline').value = '';
        } else {
            throw new Error('Failed to add goal');
        }
    } catch (error) {
        showNotification('Error adding goal', 'error');
    }
}

async function loadSavingsGoals() {
    if (!checkAuthentication()) return;
    try {
        const response = await fetch(`${API_BASE}/goals/all`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        const goals = Array.isArray(data) ? data : (data.goals || data || []);
        
        const container = document.getElementById('goalsList');
        if (!container) return;
        
        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <p>No savings goals yet. Create your first goal above!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = goals.map(goal => {
            const percentage = goal.percentage || 0;
            return `
                <div class="goal-card">
                    <div class="goal-header">
                        <h4>${goal.name}</h4>
                        <span class="amount positive">${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</span>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: #4cc9f0;"></div>
                    </div>
                    <div class="goal-progress">
                        ${percentage.toFixed(1)}% complete
                    </div>
                    
                    <div class="goal-info">
                        <div>
                            <i class="fas fa-calendar"></i>
                            ${goal.days_left ? `${goal.days_left} days left` : 'No deadline'}
                        </div>
                        <div>
                            <i class="fas fa-rupee-sign"></i>
                            ${formatCurrency(goal.needed_per_day || 0)}/day
                        </div>
                    </div>
                    
                    <div class="goal-custom-actions">
                        <div class="custom-amount-input">
                            <input type="number" id="customAmount-${goal.id}" placeholder="Amount" min="0" step="100">
                            <button class="btn btn-success" onclick="updateGoalCustom(${goal.id})">
                                <i class="fas fa-plus"></i> Add
                            </button>
                            <button class="btn btn-warning" onclick="deductGoalCustom(${goal.id})">
                                <i class="fas fa-minus"></i> Deduct
                            </button>
                        </div>
                        <button class="btn btn-danger delete-goal-btn" onclick="deleteGoal(${goal.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

async function updateGoalCustom(goalId) {
    if (!checkAuthentication()) return;
    const amountInput = document.getElementById(`customAmount-${goalId}`);
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        // First get current goal
        const response = await fetch(`${API_BASE}/goals/all`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        const goals = data.goals || data || [];
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) {
            showNotification('Goal not found', 'error');
            return;
        }
        
        const newAmount = goal.current + amount;
        const updateResponse = await fetch(`${API_BASE}/goals/update/${goalId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ current_amount: newAmount })
        });
        
        if (updateResponse.ok) {
            showNotification(`Added ${formatCurrency(amount)} to goal!`, 'success');
            amountInput.value = '';
            await loadSavingsGoals();
        } else {
            throw new Error('Failed to update goal');
        }
    } catch (error) {
        showNotification('Error updating goal', 'error');
    }
}

async function deductGoalCustom(goalId) {
    if (!checkAuthentication()) return;
    const amountInput = document.getElementById(`customAmount-${goalId}`);
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        // First get current goal
        const response = await fetch(`${API_BASE}/goals/all`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        const goals = data.goals || data || [];
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) {
            showNotification('Goal not found', 'error');
            return;
        }
        
        const newAmount = Math.max(0, goal.current - amount);
        const updateResponse = await fetch(`${API_BASE}/goals/update/${goalId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ current_amount: newAmount })
        });
        
        if (updateResponse.ok) {
            showNotification(`Deducted ${formatCurrency(amount)} from goal!`, 'success');
            amountInput.value = '';
            await loadSavingsGoals();
        } else {
            throw new Error('Failed to update goal');
        }
    } catch (error) {
        showNotification('Error updating goal', 'error');
    }
}

async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/goals/delete/${goalId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showNotification('Goal deleted successfully!', 'success');
            await loadSavingsGoals();
        } else {
            throw new Error('Failed to delete goal');
        }
    } catch (error) {
        showNotification('Error deleting goal. Please try again.', 'error');
        console.error('Delete goal error:', error);
    }
}

// Receipt Scanner Functions
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.style.backgroundColor = '#f0f2ff';
}

function handleDrop(event) {
    event.preventDefault();
    const uploadArea = event.currentTarget;
    uploadArea.style.backgroundColor = '';
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleReceiptFile(files[0]);
    }
}

function handleReceiptUpload(event) {
    const file = event.target.files[0];
    handleReceiptFile(file);
}

function handleReceiptFile(file) {
    if (!file.type.match('image.*')) {
        showNotification('Please upload an image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size should be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('receiptImage').src = e.target.result;
        document.getElementById('receiptPreview').style.display = 'block';
        document.getElementById('scanButton').style.display = 'inline-block';
        scannedReceiptData = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function scanReceipt() {
    if (!checkAuthentication()) return;
    if (!scannedReceiptData) {
        showNotification('Please upload a receipt first', 'error');
        return;
    }
    
    const categoryHint = document.getElementById('receiptCategory')?.value;
    
    document.getElementById('scanResult').style.display = 'none';
    showNotification('Scanning receipt...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/receipts/scan`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                image_base64: scannedReceiptData,
                category_hint: categoryHint || null
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('extractedData').innerHTML = `
                <div class="extracted-info">
                    <div class="extracted-grid">
                        <div><strong>Amount:</strong></div>
                        <div class="amount negative">${formatCurrency(result.extracted.amount || 0)}</div>
                        
                        <div><strong>Date:</strong></div>
                        <div>${result.extracted.date}</div>
                        
                        <div><strong>Category:</strong></div>
                        <div><span class="category-badge category-${getCategoryClass(result.extracted.category)}">
                            ${result.extracted.category}
                        </span></div>
                        
                        <div><strong>Vendor:</strong></div>
                        <div>${result.extracted.vendor || 'Not detected'}</div>
                    </div>
                    
                    ${result.text_preview ? `
                        <div class="ocr-preview">
                            <strong>OCR Text Preview:</strong>
                            <p>${result.text_preview}</p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('scanResult').style.display = 'block';
            showNotification('Receipt scanned successfully!', 'success');
            
            // Refresh achievements
            await loadAchievements();
        } else {
            showNotification('Scan failed: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Error scanning receipt', 'error');
    }
}

function clearReceipt() {
    scannedReceiptData = null;
    document.getElementById('receiptPreview').style.display = 'none';
    document.getElementById('scanButton').style.display = 'none';
    document.getElementById('scanResult').style.display = 'none';
    document.getElementById('receiptFile').value = '';
}

async function saveScannedReceipt() {
    if (!checkAuthentication()) return;
    const extractedDiv = document.getElementById('extractedData');
    if (!extractedDiv) return;
    
    const amountText = extractedDiv.querySelector('.amount')?.textContent;
    const categoryBadge = extractedDiv.querySelector('.category-badge');
    
    if (!amountText || !categoryBadge) {
        showNotification('No scanned data to save', 'error');
        return;
    }
    
    const amount = parseFloat(amountText.replace('₹', ''));
    const category = categoryBadge.textContent.trim();
    
    // Create expense from scanned data
    const expense = {
        date: new Date().toISOString().split('T')[0],
        category: category,
        amount: amount,
        description: 'Added from receipt scan'
    };

    try {
        const response = await fetch(`${API_BASE}/expenses/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(expense)
        });

        if (response.ok) {
            showNotification('Expense saved from receipt!', 'success');
            await loadExpenses();
            clearReceipt();
            
            // Refresh achievements
            await loadAchievements();
        }
    } catch (error) {
        showNotification('Error saving expense from receipt', 'error');
    }
}

// FIXED: Heatmap Functions with enhanced error handling
async function loadHeatmapData() {
    if (!checkAuthentication()) return;
    
    console.log('Loading heatmap data for:', { year: currentHeatmapYear, month: currentHeatmapMonth });
    
    try {
        const response = await fetch(`${API_BASE}/analysis/heatmap?year=${currentHeatmapYear}&month=${currentHeatmapMonth}`, {
            headers: getAuthHeaders()
        });
        
        console.log('Heatmap API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Heatmap data received:', data);
        
        // Safe guard check
        if (!data) {
            throw new Error('No data received from heatmap API');
        }
        
        // Update month display
        const heatmapTitle = document.getElementById('heatmapTitle');
        if (heatmapTitle) {
            heatmapTitle.textContent = data.month_name || 
                `${new Date(currentHeatmapYear, currentHeatmapMonth - 1).toLocaleString('default', { month: 'long' })} ${currentHeatmapYear}`;
        }
        
        // Generate heatmap even if no data
        generateHeatmap(data);
        
        // Update legend colors to match current theme
        updateHeatmapLegend();
        
        console.log('Heatmap loaded successfully');
        
    } catch (error) {
        console.error('Error loading heatmap data:', error);
        
        // Show error in heatmap container
        const container = document.getElementById('heatmapBody');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="heatmap-error">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error loading heatmap: ${error.message}</p>
                            <button class="btn btn-primary btn-sm" onclick="loadHeatmapData()">
                                <i class="fas fa-sync-alt"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Update title with error
        const heatmapTitle = document.getElementById('heatmapTitle');
        if (heatmapTitle) {
            heatmapTitle.textContent = `Error loading ${new Date(currentHeatmapYear, currentHeatmapMonth - 1).toLocaleString('default', { month: 'long' })} ${currentHeatmapYear}`;
        }
    }
}

// Heatmap color themes
const heatmapThemes = {
    green: {
        colors: ['#f0f0f0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'],
        name: 'Green (GitHub Style)'
    },
    blue: {
        colors: ['#f0f8ff', '#b3d9ff', '#66b3ff', '#1a8cff', '#0066cc'],
        name: 'Blue Ocean'
    },
    purple: {
        colors: ['#f5f0ff', '#d9b3ff', '#b366ff', '#8c1aff', '#6600cc'],
        name: 'Purple Gradient'
    },
    orange: {
        colors: ['#fff8f0', '#ffcc99', '#ff9933', '#ff6600', '#cc3300'],
        name: 'Orange Sunset'
    },
    red: {
        colors: ['#fff0f0', '#ffb3b3', '#ff6666', '#ff1a1a', '#cc0000'],
        name: 'Red Heat'
    }
};

let currentHeatmapTheme = 'green';

function changeHeatmapTheme() {
    const themeSelect = document.getElementById('heatmapTheme');
    if (themeSelect) {
        currentHeatmapTheme = themeSelect.value;
        // Update legend colors
        updateHeatmapLegend();
        // Regenerate heatmap with new colors
        loadHeatmapData();
    }
}

function updateHeatmapLegend() {
    const legendColors = document.querySelector('.legend-colors');
    if (legendColors && heatmapThemes[currentHeatmapTheme]) {
        const colors = heatmapThemes[currentHeatmapTheme].colors;
        legendColors.innerHTML = colors.map(color => 
            `<div class="legend-color" style="background-color: ${color};"></div>`
        ).join('');
    }
}

function generateHeatmap(data) {
    const container = document.getElementById('heatmapBody');
    if (!container) {
        console.error('Heatmap container not found');
        return;
    }
    
    console.log('Generating heatmap with data:', data);
    
    let html = '';
    
    // If no heatmap data, generate empty calendar
    if (!data.heatmap || data.heatmap.length === 0) {
        console.log('No heatmap data, generating empty calendar');
        
        // Generate empty calendar for the month
        const year = data.year || currentHeatmapYear;
        const month = data.month || currentHeatmapMonth;
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDay = new Date(year, month - 1, 1).getDay();
        
        let dayCount = 1;
        let weekCount = 0;
        
        // Generate weeks
        while (dayCount <= daysInMonth && weekCount < 6) {
            html += '<tr>';
            
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                if ((weekCount === 0 && dayOfWeek < firstDay) || dayCount > daysInMonth) {
                    html += '<td></td>';
                } else {
                    const colors = heatmapThemes[currentHeatmapTheme]?.colors || heatmapThemes.green.colors;
                    html += `
                        <td style="background-color: ${colors[0]}; color: #333;" 
                            title="Day ${dayCount}: No spending"
                            class="heatmap-cell intensity-0 theme-${currentHeatmapTheme}">
                            ${dayCount}
                        </td>
                    `;
                    dayCount++;
                }
            }
            
            html += '</tr>';
            weekCount++;
        }
    } else {
        // FIXED: Better color calculation for different spending levels
        // First, collect all spending amounts to create proper color ranges
        let allAmounts = [];
        data.heatmap.forEach(week => {
            week.forEach(day => {
                if (day.day !== null && day.day !== undefined && day.amount > 0) {
                    allAmounts.push(day.amount);
                }
            });
        });
        
        // Sort amounts to create color thresholds
        allAmounts.sort((a, b) => b - a); // Highest to lowest
        const uniqueAmounts = [...new Set(allAmounts)]; // Remove duplicates
        
        console.log('Unique spending amounts:', uniqueAmounts);
        
        // Generate calendar with data - PROPER COLOR CALCULATION
        data.heatmap.forEach(week => {
            html += '<tr>';
            week.forEach(day => {
                if (day.day === null || day.day === undefined) {
                    html += '<td></td>';
                } else {
                    let intensity = 0;
                    
                    if (day.amount > 0 && uniqueAmounts.length > 0) {
                        // Find the rank of this amount (0 = highest, 1 = second highest, etc.)
                        const rank = uniqueAmounts.indexOf(day.amount);
                        
                        if (uniqueAmounts.length === 1) {
                            // Only one spending amount - use highest intensity
                            intensity = 4;
                        } else if (uniqueAmounts.length === 2) {
                            // Two amounts - highest gets 4, lower gets 2
                            intensity = rank === 0 ? 4 : 2;
                        } else if (uniqueAmounts.length === 3) {
                            // Three amounts - 4, 3, 1
                            intensity = rank === 0 ? 4 : (rank === 1 ? 3 : 1);
                        } else {
                            // More amounts - distribute across all 5 levels (0-4)
                            const maxRank = uniqueAmounts.length - 1;
                            intensity = Math.round(4 - (rank / maxRank) * 4);
                        }
                    }
                    
                    // Get colors from current theme
                    const colors = heatmapThemes[currentHeatmapTheme]?.colors || heatmapThemes.green.colors;
                    
                    // Determine text color based on background brightness
                    const textColor = intensity > 2 ? 'white' : '#333';
                    
                    console.log(`Day ${day.day}: Amount ${day.amount}, Rank ${uniqueAmounts.indexOf(day.amount)}, Intensity ${intensity}`);
                    
                    html += `
                        <td style="background-color: ${colors[intensity]}; color: ${textColor};" 
                            title="Day ${day.day}: ${day.amount > 0 ? formatCurrency(day.amount) : 'No spending'} (Level ${intensity})"
                            class="heatmap-cell intensity-${intensity} theme-${currentHeatmapTheme}">
                            ${day.day}
                        </td>
                    `;
                }
            });
            html += '</tr>';
        });
    }
    
    container.innerHTML = html;
    console.log('Heatmap generated successfully - showing proper color levels for different amounts');
}

function changeHeatmapMonth(delta) {
    currentHeatmapMonth += delta;
    
    if (currentHeatmapMonth > 12) {
        currentHeatmapMonth = 1;
        currentHeatmapYear += 1;
    } else if (currentHeatmapMonth < 1) {
        currentHeatmapMonth = 12;
        currentHeatmapYear -= 1;
    }
    
    loadHeatmapData();
}

// Behavior Analysis Functions
async function analyzeBehavior() {
    await analyzePatterns();
    await getPredictions();
}

async function analyzePatterns() {
    if (!checkAuthentication()) return;
    const container = document.getElementById('patternsList');
    if (!container) {
        console.error('Patterns container not found');
        return;
    }
    
    container.innerHTML = '<div class="loading">🔍 Analyzing spending patterns...</div>';
    
    try {
        console.log('Fetching patterns from API...');
        const response = await fetch(`${API_BASE}/analysis/patterns`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Patterns data received:', data);
        const patterns = Array.isArray(data) ? data : (data.patterns || data || []);
        
        if (patterns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No significant patterns detected. Your spending looks healthy!</p>
                    <div class="pattern-tips">
                        <h5>Tips for Better Analysis:</h5>
                        <ul>
                            <li>Add more expenses for better pattern detection</li>
                            <li>Use consistent categories</li>
                            <li>Track expenses for at least a week</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = patterns.map(pattern => `
            <div class="pattern-card">
                <div class="pattern-content">
                    <div class="pattern-icon" style="background: ${getPatternColor(pattern.impact)};">
                        <i class="fas fa-${getPatternIcon(pattern.type || 'general')}"></i>
                    </div>
                    <div class="pattern-details">
                        <h4>${pattern.description || 'Spending Pattern Detected'}</h4>
                        <div class="pattern-tags">
                            <span class="badge" style="background: ${getPatternColor(pattern.impact)}; color: white;">
                                ${pattern.impact || 'Medium'} Impact
                            </span>
                            <span class="pattern-type">
                                <i class="fas fa-lightbulb"></i> ${(pattern.type || 'general').replace('_', ' ')}
                            </span>
                        </div>
                        <p class="pattern-suggestion">
                            <i class="fas fa-tips"></i> ${pattern.suggestion || 'Keep tracking your expenses for better insights.'}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log(`Loaded ${patterns.length} spending patterns`);
        
    } catch (error) {
        console.error('Error analyzing patterns:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error analyzing patterns. Please try again.</p>
                <button class="btn btn-primary" onclick="analyzePatterns()">
                    <i class="fas fa-sync-alt"></i> Retry Analysis
                </button>
            </div>
        `;
    }
}

async function getPredictions() {
    if (!checkAuthentication()) return;
    const container = document.getElementById('predictionsList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"></div> Generating...';
    
    try {
        const response = await fetch(`${API_BASE}/analysis/predictions?months=3`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        const predictions = Array.isArray(data) ? data : (data.predictions || data || []);
        
        if (predictions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>Need more data for predictions. Add more expenses!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = predictions.map(pred => `
            <div class="prediction-card">
                <div class="prediction-header">
                    <h4>${pred.month}</h4>
                    <span class="badge" style="background: ${pred.confidence === 'high' ? '#4cc9f0' : pred.confidence === 'medium' ? '#f8961e' : '#f72585'}; 
                          color: white;">
                        ${pred.confidence} confidence
                    </span>
                </div>
                <div class="prediction-amount">
                    ${formatCurrency(pred.predicted_amount)}
                </div>
                <div class="prediction-note">
                    <i class="fas fa-info-circle"></i> Based on your past spending patterns
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<p class="error">Error generating predictions</p>';
    }
}

async function loadPatterns() {
    await analyzePatterns();
}

// Natural Language Search
async function naturalLanguageSearch() {
    if (!checkAuthentication()) return;
    const query = document.getElementById('nlQuery')?.value.trim();
    if (!query) {
        showNotification('Please enter a search query', 'error');
        return;
    }
    
    const container = document.getElementById('nlResults');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"></div> Searching...';
    
    try {
        const response = await fetch(`${API_BASE}/expenses/natural-language-search`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        if (result.count === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No expenses found for "${query}"</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="nl-results-header">
                Found ${result.count} expenses for: <strong>"${query}"</strong>
            </div>
            <div class="nl-results-list">
                ${result.results.map(expense => `
                    <div class="nl-result-item">
                        <div class="nl-result-header">
                            <div>
                                <span class="category-badge category-${getCategoryClass(expense[2])}">
                                    ${expense[2]}
                                </span>
                                <span class="nl-result-date">${expense[1]}</span>
                            </div>
                            <span class="amount negative">${formatCurrency(expense[3])}</span>
                        </div>
                        <div class="nl-result-description">
                            ${expense[4] || 'No description'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        container.innerHTML = '<p class="error">Error performing search</p>';
    }
}

// Spending Score Functions
async function loadSpendingScore() {
    if (!checkAuthentication()) {
        console.log('Not authenticated, skipping score load');
        return;
    }

    try {
        console.log('Loading spending score...');
        console.log('API_BASE:', API_BASE);
        console.log('Auth headers:', getAuthHeaders());
        
        const response = await fetch(`${API_BASE}/analysis/score`, {
            headers: getAuthHeaders()
        });
        
        console.log('Score response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Spending score data received:', data);
        const scoreData = data || {};
        
        // Check if elements exist
        const scoreValueEl = document.getElementById('scoreValueAchievements');
        const scoreRatingEl = document.getElementById('scoreRatingAchievements');
        const circleEl = document.getElementById('scoreCircleAchievements');
        
        console.log('Score elements found:', {
            scoreValue: !!scoreValueEl,
            scoreRating: !!scoreRatingEl,
            circle: !!circleEl
        });
        
        // Update achievements tab score
        if (scoreValueEl) {
            scoreValueEl.textContent = scoreData.score || 0;
            console.log('Updated score value to:', scoreData.score || 0);
        }
        if (scoreRatingEl) {
            scoreRatingEl.textContent = scoreData.rating || 'Good';
            scoreRatingEl.style.color = scoreData.color || '#4cc9f0';
            console.log('Updated score rating to:', scoreData.rating || 'Good');
        }
        
        // Update score circle in achievements tab
        if (circleEl) {
            const score = scoreData.score || 0;
            const color = scoreData.color || '#4cc9f0';
            circleEl.style.background = `conic-gradient(${color} 0% ${score}%, #e9ecef ${score}% 100%)`;
            console.log('Updated score circle with score:', score, 'color:', color);
        }
        
        console.log('Spending score updated successfully');
        
    } catch (error) {
        console.error('Error loading spending score:', error);
        // Set default values on error
        const defaultScore = { score: 70, rating: 'Good', color: '#4cc9f0' };
        
        const scoreValueEl = document.getElementById('scoreValueAchievements');
        const scoreRatingEl = document.getElementById('scoreRatingAchievements');
        
        if (scoreValueEl) {
            scoreValueEl.textContent = defaultScore.score;
            console.log('Set default score value:', defaultScore.score);
        }
        
        if (scoreRatingEl) {
            scoreRatingEl.textContent = defaultScore.rating;
            scoreRatingEl.style.color = defaultScore.color;
            console.log('Set default score rating:', defaultScore.rating);
        }
    }
}

// Achievements Functions
async function loadAchievements() {
    if (!checkAuthentication()) return;
    try {
        console.log('Loading achievements...');
        const response = await fetch(`${API_BASE}/achievements/all`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Achievements data received:', data);
        
        // Handle both response formats
        const achievementsData = data || {};
        const achievements = achievementsData.earned || achievementsData || [];
        
        const container = document.getElementById('achievementsGrid');
        if (!container) {
            console.error('Achievements container not found');
            return;
        }
        
        if (achievements.length === 0) {
            container.innerHTML = `
                <div class="achievements-placeholder">
                    <i class="fas fa-trophy"></i>
                    <p>No achievements yet. Start tracking expenses to earn badges!</p>
                    <div class="achievement-hints">
                        <p><strong>Available Achievements:</strong></p>
                        <ul>
                            <li>🎯 Getting Started - Add your first expense</li>
                            <li>📊 Active Tracker - Track 10+ expenses</li>
                            <li>🔥 7-Day Streak - Track expenses for 7 days</li>
                            <li>🗂️ Category Explorer - Use 5+ categories</li>
                            <li>💎 Big Purchase - Track expense over ₹5,000</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-card">
                <div class="achievement-content">
                    <div class="achievement-icon">
                        ${achievement.icon || '🏅'}
                    </div>
                    <h4>${achievement.title || achievement.badge_name || 'Achievement'}</h4>
                    <p class="achievement-description">
                        ${achievement.description || 'Achievement earned!'}
                    </p>
                    <div class="achievement-meta">
                        <span><i class="fas fa-award"></i> ${achievement.badge_type || 'General'}</span>
                        <span><i class="fas fa-calendar"></i> ${achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : 'Recently'}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Show notification for new achievements
        if (achievementsData.new && achievementsData.new.length > 0) {
            setTimeout(() => {
                achievementsData.new.forEach(ach => {
                    showNotification(`🎉 New Achievement Unlocked: ${ach.title}`, 'success');
                });
            }, 1000);
        }
        
        console.log(`Loaded ${achievements.length} achievements`);
        
    } catch (error) {
        console.error('Error loading achievements:', error);
        const container = document.getElementById('achievementsGrid');
        if (container) {
            container.innerHTML = `
                <div class="achievements-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading achievements. Please try again.</p>
                    <button class="btn btn-primary" onclick="loadAchievements()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Get AI suggestions
async function getAISuggestions() {
    if (!checkAuthentication()) return;
    if (!aiContentEl) return;
    
    aiContentEl.innerHTML = '<div class="loading"></div> Analyzing your spending patterns...';
    if (analyzeContentEl) analyzeContentEl.innerHTML = '<div class="loading"></div> Generating analysis...';
    
    try {
        const response = await fetch(`${API_BASE}/ai/suggestions`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        aiContentEl.innerHTML = `
            <div class="ai-title">
                <i class="fas fa-robot"></i> <strong>AI Financial Assistant</strong>
            </div>
            ${data.ai_suggestions ? data.ai_suggestions.replace(/\n/g, '<br>') : 'No suggestions available'}
        `;
        
        // Update analysis content
        updateAnalysisContent();
    } catch (error) {
        console.error('AI suggestions error:', error);
        aiContentEl.innerHTML = `
            <div class="ai-error">
                <i class="fas fa-exclamation-triangle"></i> AI service unavailable
            </div>
            <p>Here are some general tips:</p>
            <ul class="ai-tips">
                <li>Track your expenses daily</li>
                <li>Set a monthly budget for each category</li>
                <li>Review and cancel unused subscriptions</li>
                <li>Plan meals to reduce food delivery costs</li>
                <li>Use the 30-day rule for non-essential purchases</li>
            </ul>
        `;
        
        if (analyzeContentEl) analyzeContentEl.innerHTML = 'Analysis could not be generated. Please try again later.';
    }
}

// Update analysis content
function updateAnalysisContent() {
    if (!analyzeContentEl) return;
    
    if (expenses.length === 0) {
        analyzeContentEl.innerHTML = 'No expenses to analyze. Add some expenses first.';
        return;
    }

    const total = expenses.reduce((sum, expense) => sum + expense[3], 0);
    const count = expenses.length;
    const avgExpense = total / count;
    
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense[2];
        categoryTotals[category] = (categoryTotals[category] || 0) + expense[3];
    });
    
    const highestCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    analyzeContentEl.innerHTML = `
        <div class="analysis-grid">
            <div class="analysis-item">
                <h4>Total Spending</h4>
                <p>${formatCurrency(total)}</p>
                <span>across ${count} transactions</span>
            </div>
            <div class="analysis-item">
                <h4>Average Expense</h4>
                <p>${formatCurrency(avgExpense)}</p>
                <span>per transaction</span>
            </div>
            <div class="analysis-item">
                <h4>Highest Category</h4>
                <p>${highestCategory[0]}</p>
                <span>${formatCurrency(highestCategory[1])} (${(highestCategory[1]/total*100 || 0).toFixed(1)}%)</span>
            </div>
        </div>
    `;
}

// Get budget tips
async function getBudgetTips() {
    if (!aiContentEl) return;
    
    aiContentEl.innerHTML = '<div class="loading"></div> Generating budget tips...';
    
    setTimeout(() => {
        aiContentEl.innerHTML = `
            <div class="budget-tips-title">
                <i class="fas fa-piggy-bank"></i> <strong>Budgeting Tips</strong>
            </div>
            <ul class="budget-tips-list">
                <li><strong>50/30/20 Rule:</strong> 50% needs, 30% wants, 20% savings</li>
                <li><strong>Envelope System:</strong> Allocate cash for each category</li>
                <li><strong>Zero-Based Budget:</strong> Every dollar has a purpose</li>
                <li><strong>Automate Savings:</strong> Set up automatic transfers</li>
                <li><strong>Track Weekly:</strong> Review spending every Sunday</li>
                <li><strong>Emergency Fund:</strong> Save 3-6 months of expenses</li>
                <li><strong>Debt Snowball:</strong> Pay smallest debts first</li>
            </ul>
        `;
    }, 1000);
}

// Forecast spending
async function forecastSpending() {
    if (!aiContentEl) return;
    
    aiContentEl.innerHTML = '<div class="loading"></div> Generating spending forecast...';
    
    setTimeout(() => {
        const total = expenses.reduce((sum, expense) => sum + expense[3], 0);
        const avgMonthly = expenses.length > 0 ? total / (expenses.length / 30) : 0;
        
        aiContentEl.innerHTML = `
            <div class="forecast-title">
                <i class="fas fa-crystal-ball"></i> <strong>Spending Forecast</strong>
            </div>
            <p>Based on current patterns, you're projected to spend:</p>
            <ul class="forecast-list">
                <li><strong>This month:</strong> ${formatCurrency(avgMonthly)}</li>
                <li><strong>Next 3 months:</strong> ${formatCurrency(avgMonthly * 3)}</li>
                <li><strong>Yearly total:</strong> ${formatCurrency(avgMonthly * 12)}</li>
            </ul>
            <p class="forecast-note"><em>Tip: Consider setting aside 10% for unexpected expenses.</em></p>
        `;
    }, 1000);
}

// Export to Excel
function exportToExcel() {
    if (expenses.length === 0) {
        showNotification('No expenses to export', 'warning');
        return;
    }

    try {
        // Prepare data
        const data = [
            ['Date', 'Category', 'Description', 'Amount (₹)', 'ID'],
            ...expenses.map(expense => [
                expense[1],
                expense[2],
                expense[4] || '',
                expense[3],
                expense[0]
            ])
        ];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

        // Generate file
        const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showNotification('Data exported to Excel successfully!', 'success');
    } catch (error) {
        showNotification('Error exporting to Excel', 'error');
        console.error('Export error:', error);
    }
}

// Helper functions for pattern analysis
function getPatternColor(impact) {
    const colors = {
        'high': '#f72585',
        'medium': '#f8961e', 
        'low': '#4cc9f0',
        'positive': '#06ffa5',
        'negative': '#f72585',
        'neutral': '#4cc9f0'
    };
    return colors[impact?.toLowerCase()] || colors.medium;
}

function getPatternIcon(type) {
    const icons = {
        'spending': 'chart-line',
        'category': 'tags',
        'time': 'clock',
        'frequency': 'sync-alt',
        'amount': 'dollar-sign',
        'trend': 'trending-up',
        'seasonal': 'calendar-alt',
        'weekly': 'calendar-week',
        'monthly': 'calendar',
        'general': 'chart-bar'
    };
    return icons[type?.toLowerCase()] || icons.general;
}

function getPredictionColor(confidence) {
    const colors = {
        'high': '#4cc9f0',
        'medium': '#f8961e',
        'low': '#f72585'
    };
    return colors[confidence?.toLowerCase()] || colors.medium;
}