// theme.js - Theme Toggle Logic

const THEME_KEY = 'uniwallet_theme';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    // Default to dark mode if no saved preference
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
        btn.innerHTML = isLight ? '🌙' : '☀️';
    });
}

// Run as soon as the script loads
initTheme();

// After DOM is fully loaded, update icons
document.addEventListener('DOMContentLoaded', updateThemeIcon);
