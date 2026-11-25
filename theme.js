// theme.js - Warm Editorial Dual Theme Controller

const THEME_KEY = 'uniwallet_theme';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
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
        const iconSlot = btn.querySelector('.nav-icon-slot');
        const iconSpan = btn.querySelector('span:not(.nav-icon-slot)');
        const label = isLight ? 'Dark Mode' : 'Light Mode';
        const iconName = isLight ? 'moon' : 'sun';
        if (iconSlot) {
            iconSlot.innerHTML = `<i data-lucide="${iconName}"></i>`;
            if (iconSpan) iconSpan.textContent = label;
        } else if (iconSpan) {
            btn.innerHTML = `<i data-lucide="${iconName}"></i> <span>${label}</span>`;
        } else {
            btn.innerHTML = `<i data-lucide="${iconName}" style="width:17px; height:17px;"></i>`;
        }
        btn.setAttribute('aria-label', `Switch to ${label}`);
        btn.setAttribute('title', `Switch to ${label}`);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

// Run immediately to avoid flash of unstyled theme
initTheme();

// Sync icons once DOM is ready
document.addEventListener('DOMContentLoaded', updateThemeIcon);
