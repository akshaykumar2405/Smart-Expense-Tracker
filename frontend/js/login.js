/* =========================
   PASSWORD VISIBILITY TOGGLE
========================= */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const eyeIcon = document.getElementById(inputId + '-eye');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

/* =========================
   CONFIG
========================= */
const API_BASE = "http://127.0.0.1:8000";

/* =========================
   AUTH HELPERS
========================= */
function getToken() {
    return localStorage.getItem("access_token");
}

function saveAuth(data) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("user_email", data.email);
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

/* =========================
   NOTIFICATION SYSTEM
========================= */
function showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

/* =========================
   CHECK AUTH (PROTECT PAGES)
========================= */
function checkAuthOnProtectedPage() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
    }
}

function redirectIfLoggedIn() {
    const token = getToken();
    if (token) {
        window.location.href = "index.html";
    }
}

/* =========================
   LOGIN
========================= */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        showNotification("Please enter both email and password", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showNotification(data.detail || "Login failed", "error");
            return;
        }

        saveAuth(data);
        showNotification("Login successful", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);

    } catch (err) {
        console.error(err);
        showNotification("Server error", "error");
    }
}

/* =========================
   SIGNUP
========================= */
async function handleSignup(e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName")?.value;
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const confirm = document.getElementById("confirmPassword")?.value;

    if (!email || !password) {
        showNotification("Email and Password are required", "error");
        return;
    }

    if (password.length < 6 || password.length > 20) {
        showNotification("Password must be between 6-20 characters", "error");
        return;
    }

    if (password !== confirm) {
        showNotification("Passwords do not match", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password,
                full_name: fullName || null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showNotification(data.detail || "Signup failed", "error");
            return;
        }

        saveAuth(data);
        showNotification("Signup successful", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);

    } catch (err) {
        console.error(err);
        showNotification("Server error", "error");
    }
}

/* =========================
   INIT (AUTO DETECT PAGE)
========================= */
document.addEventListener("DOMContentLoaded", () => {

    // login.html
    if (document.getElementById("loginForm")) {
        redirectIfLoggedIn();
        document.getElementById("loginForm").addEventListener("submit", handleLogin);
    }

    // signup.html
    if (document.getElementById("signupForm")) {
        redirectIfLoggedIn();
        document.getElementById("signupForm").addEventListener("submit", handleSignup);
    }

    // index.html (protected)
    if (window.location.pathname.includes("index.html")) {
        checkAuthOnProtectedPage();
    }
});
