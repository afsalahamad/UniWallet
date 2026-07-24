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

// Utility to generate a unique 12-character uppercase recovery code (Format: UNI-XXXX-YYYY)
function generateRecoveryCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `UNI-${part1}-${part2}`;
}

// Signup Logic
function signup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const securityQuestion = document.getElementById('signupQuestion') ? document.getElementById('signupQuestion').value : '';
    const securityAnswer = document.getElementById('signupAnswer') ? document.getElementById('signupAnswer').value.trim() : '';

    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
        showAuthError('Please fill in all fields including the security question and answer.');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters long.');
        return;
    }

    const users = getUsers();

    // Check if user already exists (case-insensitive check)
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showAuthError('An account with this email already exists.');
        return;
    }

    const recoveryCode = generateRecoveryCode();

    // Create new user object
    const newUser = {
        id: Date.now(),
        name,
        email,
        password, // In a real app, this should be hashed!
        securityQuestion,
        securityAnswer: securityAnswer.toLowerCase(), // Normalized for case-insensitive verification
        recoveryCode
    };

    users.push(newUser);
    saveUsers(users);

    // Display generated Recovery Code in modal before redirecting
    showSignupSuccessModal(recoveryCode);
}

// Display Signup Success Modal with Recovery Code
function showSignupSuccessModal(code) {
    const modal = document.getElementById('signupSuccessModal');
    const codeDisplay = document.getElementById('displayRecoveryCode');
    if (modal && codeDisplay) {
        codeDisplay.textContent = code;
        modal.classList.add('active');
        if (window.lucide) lucide.createIcons();
    } else {
        alert(`Account created successfully!\n\nYour Secret Recovery Code: ${code}\n\nPlease save this code. You will need it if you forget your password!`);
        window.location.href = 'login.html';
    }
}

// Copy Recovery Code to clipboard
function copyRecoveryCode() {
    const codeDisplay = document.getElementById('displayRecoveryCode');
    const copyBtn = document.getElementById('copyCodeBtn');
    if (codeDisplay) {
        const text = codeDisplay.textContent;
        navigator.clipboard.writeText(text).then(() => {
            if (copyBtn) {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = `<i data-lucide="check" style="width:16px;height:16px;"></i> Copied!`;
                if (window.lucide) lucide.createIcons();
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    if (window.lucide) lucide.createIcons();
                }, 2000);
            }
        }).catch(() => {
            // Fallback for clipboard copy
            alert(`Recovery Code: ${text}`);
        });
    }
}

// Finish registration and navigate to login
function finishSignup() {
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
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

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

// Utility to show auth errors on login/signup forms
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

// =========================================================
// 🔒 PASSWORD RECOVERY SERVICE & MODAL CONTROLLER
// =========================================================

// Password Recovery Abstraction Layer (Compatible with future Supabase integration)
const PasswordRecoveryService = {
    // 1. Verify if email exists and fetch recovery metadata
    verifyAccountEmail: function (email) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (!user) {
            return { success: false, message: 'No account found with this email address.' };
        }
        return {
            success: true,
            user: {
                email: user.email,
                securityQuestion: user.securityQuestion || 'What is your security question?'
            }
        };
    },

    // 2. Verify Security Answer (case-insensitive)
    verifySecurityAnswer: function (email, answer) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (!user) {
            return { success: false, message: 'Account not found.' };
        }

        const savedAnswer = (user.securityAnswer || '').toLowerCase().trim();
        const providedAnswer = (answer || '').toLowerCase().trim();

        if (!providedAnswer) {
            return { success: false, message: 'Please enter your security answer.' };
        }

        if (savedAnswer && savedAnswer === providedAnswer) {
            return { success: true };
        } else {
            return { success: false, message: 'Incorrect security answer. Please try again.' };
        }
    },

    // 3. Verify Recovery Code (case-insensitive & whitespace resilient)
    verifyRecoveryCode: function (email, code) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (!user) {
            return { success: false, message: 'Account not found.' };
        }

        const savedCode = (user.recoveryCode || '').replace(/[\s-]/g, '').toUpperCase();
        const providedCode = (code || '').replace(/[\s-]/g, '').toUpperCase();

        if (!providedCode) {
            return { success: false, message: 'Please enter your recovery code.' };
        }

        if (savedCode && savedCode === providedCode) {
            return { success: true };
        } else {
            return { success: false, message: 'Invalid recovery code. Please check and try again.' };
        }
    },

    // 4. Update Password in LocalStorage
    resetUserPassword: function (email, newPassword) {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (userIndex === -1) {
            return { success: false, message: 'Account not found.' };
        }

        if (!newPassword || newPassword.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters long.' };
        }

        // Update password
        users[userIndex].password = newPassword;
        saveUsers(users);

        // If the user being reset happens to be logged in, update session
        const sessionUser = getCurrentUser();
        if (sessionUser && sessionUser.email.toLowerCase() === email.toLowerCase().trim()) {
            sessionUser.password = newPassword;
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        }

        return { success: true };
    }
};

// Modal State Controller
let forgotModalState = {
    email: '',
    step: 1,
    method: 'question' // 'question' | 'code'
};

function openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;

    forgotModalState = {
        email: '',
        step: 1,
        method: 'question'
    };

    // Pre-fill email if user already typed it in login form
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail && loginEmail.value.trim()) {
        const emailInput = document.getElementById('forgotEmail');
        if (emailInput) emailInput.value = loginEmail.value.trim();
    }

    renderModalStep(1);
    hideModalError();
    modal.classList.add('active');
    if (window.lucide) lucide.createIcons();
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function hideModalError() {
    const errorEl = document.getElementById('forgotModalError');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

function showModalError(message) {
    const errorEl = document.getElementById('forgotModalError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else {
        alert(message);
    }
}

function renderModalStep(step) {
    forgotModalState.step = step;
    hideModalError();

    const step1 = document.getElementById('forgotStep1');
    const step2 = document.getElementById('forgotStep2');
    const step3 = document.getElementById('forgotStep3');
    const step4 = document.getElementById('forgotStep4');

    if (step1) step1.style.display = step === 1 ? 'block' : 'none';
    if (step2) step2.style.display = step === 2 ? 'block' : 'none';
    if (step3) step3.style.display = step === 3 ? 'block' : 'none';
    if (step4) step4.style.display = step === 4 ? 'block' : 'none';

    const titleEl = document.getElementById('forgotModalTitle');
    const subtitleEl = document.getElementById('forgotModalSubtitle');

    if (step === 1) {
        if (titleEl) titleEl.textContent = 'Account Recovery';
        if (subtitleEl) subtitleEl.textContent = 'Enter your registered email to get started.';
    } else if (step === 2) {
        if (titleEl) titleEl.textContent = 'Identity Verification';
        if (subtitleEl) subtitleEl.textContent = 'Verify your security details to reset password.';
    } else if (step === 3) {
        if (titleEl) titleEl.textContent = 'Reset Password';
        if (subtitleEl) subtitleEl.textContent = 'Create a new secure password for your account.';
    } else if (step === 4) {
        if (titleEl) titleEl.textContent = 'Success!';
        if (subtitleEl) subtitleEl.textContent = 'Your password has been reset successfully.';
    }

    if (window.lucide) lucide.createIcons();
}

function handleForgotStep1(event) {
    event.preventDefault();
    hideModalError();

    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) {
        showModalError('Please enter your registered email address.');
        return;
    }

    const res = PasswordRecoveryService.verifyAccountEmail(email);
    if (!res.success) {
        showModalError(res.message);
        return;
    }

    forgotModalState.email = res.user.email;
    const questionBox = document.getElementById('displaySecurityQuestion');
    if (questionBox) {
        questionBox.textContent = res.user.securityQuestion || 'What is your security question?';
    }

    switchRecoveryTab('question');
    renderModalStep(2);
}

function switchRecoveryTab(method) {
    forgotModalState.method = method;
    hideModalError();

    const tabQuestionBtn = document.getElementById('tabQuestionBtn');
    const tabCodeBtn = document.getElementById('tabCodeBtn');
    const questionContent = document.getElementById('tabQuestionContent');
    const codeContent = document.getElementById('tabCodeContent');

    if (method === 'question') {
        if (tabQuestionBtn) tabQuestionBtn.classList.add('active');
        if (tabCodeBtn) tabCodeBtn.classList.remove('active');
        if (questionContent) questionContent.style.display = 'block';
        if (codeContent) codeContent.style.display = 'none';
    } else {
        if (tabCodeBtn) tabCodeBtn.classList.add('active');
        if (tabQuestionBtn) tabQuestionBtn.classList.remove('active');
        if (codeContent) codeContent.style.display = 'block';
        if (questionContent) questionContent.style.display = 'none';
    }
}

function handleForgotStep2(event) {
    event.preventDefault();
    hideModalError();

    const email = forgotModalState.email;

    if (forgotModalState.method === 'question') {
        const answer = document.getElementById('forgotAnswer').value.trim();
        const res = PasswordRecoveryService.verifySecurityAnswer(email, answer);
        if (!res.success) {
            showModalError(res.message);
            return;
        }
    } else {
        const code = document.getElementById('forgotCode').value.trim();
        const res = PasswordRecoveryService.verifyRecoveryCode(email, code);
        if (!res.success) {
            showModalError(res.message);
            return;
        }
    }

    // Verification passed -> proceed to step 3
    renderModalStep(3);
}

function handleForgotStep3(event) {
    event.preventDefault();
    hideModalError();

    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;

    if (!newPass || newPass.length < 6) {
        showModalError('Password must be at least 6 characters long.');
        return;
    }

    if (newPass !== confirmPass) {
        showModalError('Passwords do not match. Please check and re-enter.');
        return;
    }

    const res = PasswordRecoveryService.resetUserPassword(forgotModalState.email, newPass);
    if (!res.success) {
        showModalError(res.message);
        return;
    }

    renderModalStep(4);
}

function finishPasswordReset() {
    closeForgotPasswordModal();

    // Pre-fill email in login form
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginEmail) loginEmail.value = forgotModalState.email;
    if (loginPassword) loginPassword.value = '';

    // Clear inputs in modal
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotAnswer = document.getElementById('forgotAnswer');
    const forgotCode = document.getElementById('forgotCode');
    const newPassword = document.getElementById('newPassword');
    const confirmNewPassword = document.getElementById('confirmNewPassword');

    if (forgotEmail) forgotEmail.value = '';
    if (forgotAnswer) forgotAnswer.value = '';
    if (forgotCode) forgotCode.value = '';
    if (newPassword) newPassword.value = '';
    if (confirmNewPassword) confirmNewPassword.value = '';
}

// Global Event Listener for Escape key & Backdrop click for modals
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeForgotPasswordModal();
    }
});

document.addEventListener('click', function (e) {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal && e.target === modal) {
        closeForgotPasswordModal();
    }
});

