// auth.js - Mock Authentication Logic using localStorage

const USERS_KEY = 'uniwallet_users';
const SESSION_KEY = 'uniwallet_session';

// Helper to get users from localStorage
function getUsers() {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Failed to parse users", e);
        return [];
    }
}

// Helper to save users to localStorage
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Signup Logic
function signup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showAuthError('Please fill in all fields.');
        return;
    }

    const users = getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showAuthError('An account with this email already exists.');
        return;
    }

    // Create new user object
    const newUser = {
        id: Date.now(),
        name,
        email,
        password // In a real app, this should be hashed!
    };

    users.push(newUser);
    saveUsers(users);

    // After signup, redirect to login page for user to log in
    window.location.href = 'login.html';
}

// Login Logic
function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields.');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        sessionStorage.setItem('uniwallet_show_welcome', 'true'); // Flag to show onboarding on first dashboard visit
        window.location.href = 'index.html';
    } else {
        showAuthError('Invalid email or password.');
    }
}

// Logout Logic
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

// Get current session user without redirecting
function getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    try {
        return session ? JSON.parse(session) : null;
    } catch (e) {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

// Redirect logged-in users away from login/signup pages
function redirectIfLoggedIn() {
    if (getCurrentUser()) {
        window.location.href = 'index.html';
    }
}

// Check session on protected pages and redirect if not logged in
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Utility to show auth errors
function showAuthError(message) {
    const errorEl = document.getElementById('authError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else {
        alert(message);
    }
}

// Guest Login Logic
function guestLogin() {
    console.log("Initializing guest login sequence...");
    const guestUser = {
        id: 'guest',
        name: 'Guest Explorer',
        email: 'guest@uniwallet.com',
        isGuest: true
    };
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(guestUser));
        sessionStorage.setItem('uniwallet_show_welcome', 'true');
        console.log("Guest session created. Redirecting to dashboard...");
        window.location.href = 'index.html';
    } catch (err) {
        console.error("Critical: Guest login failed", err);
        alert("System error during guest access. Please check your browser's private mode settings.");
    }
}
