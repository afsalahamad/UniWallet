// theme.js - Theme Toggle Logic

const THEME_KEY = 'uniwallet_theme';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
        const iconSpan = btn.querySelector('span');
        if (iconSpan) {
            btn.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}"></i> <span>Toggle Theme</span>`;
        } else {
            btn.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}"></i>`;
        }
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

// Run as soon as script loads
initTheme();

// Update icons after DOM loads
document.addEventListener('DOMContentLoaded', updateThemeIcon);
