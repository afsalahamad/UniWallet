// Solaris V2 - Professional Sidebar Dashboard Logic

// ---- CLOCK LOGIC (Runs immediately to ensure responsiveness) ----
function startClock() {
    setInterval(() => {
        const timeEl = document.getElementById('currentTime');
        const dateEl = document.getElementById('currentDate');
        if (timeEl && dateEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
            dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
        }
    }, 1000);
}
startClock();

// ---- AUTHENTICATION CHECK ----
const currentUser = typeof requireAuth === 'function' ? requireAuth() : null;
if (!currentUser) {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        document.body.style.display = 'none';
        window.location.href = 'login.html';
    }
}

// ---- STATE ----
let data = {
    transactions: [],
    budgets: {},
    splits: [],
    goals: [],
    recurring: [],
    loans: [],
    profile: {
        name: currentUser ? (currentUser.name || '') : '',
        phone: '',
        avatar: null
    }
};

let txType = 'expense';
const DATA_KEY = currentUser ? ('uniwallet_data_' + currentUser.id) : null;

const CATS = {
    food: { label: 'Food', icon: '🍜', color: '#10b981' },
    transport: { label: 'Transport', icon: '🚌', color: '#3b82f6' },
    study: { label: 'Study', icon: '📚', color: '#6366f1' },
    entertainment: { label: 'Game', icon: '🎮', color: '#f59e0b' },
    health: { label: 'Health', icon: '💊', color: '#ef4444' },
    shopping: { label: 'Shop', icon: '🛍️', color: '#ec4899' },
    subscription: { label: 'Subscription', icon: '🔄', color: '#8b5cf6' },
    other: { label: 'Other', icon: '📦', color: '#94a3b8' },
    allowance: { label: 'Allowance', icon: '💰', color: '#10b981' },
    salary: { label: 'Salary', icon: '💼', color: '#10b981' },
    gift: { label: 'Gift', icon: '🎁', color: '#f59e0b' },
    refund: { label: 'Refund', icon: '🔙', color: '#3b82f6' },
    savings: { label: 'Savings', icon: '🏦', color: '#6366f1' }
};

function saveData() {
    if (DATA_KEY) localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function loadData() {
    if (!DATA_KEY) return;
    const saved = localStorage.getItem(DATA_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            data = { ...data, ...parsed };
            // Ensure mandatory arrays exist
            if (!data.transactions) data.transactions = [];
            if (!data.budgets) data.budgets = {};
            if (!data.goals) data.goals = [];
            if (!data.splits) data.splits = [];
            if (!data.recurring) data.recurring = [];
            if (!data.loans) data.loans = [];
            if (!data.profile) data.profile = {};

            // Sync Profile with Signup data if empty
            if (!data.profile.name && currentUser) data.profile.name = currentUser.name || '';
            if (!data.profile.email && currentUser) data.profile.email = currentUser.email || '';
        } catch (e) {
            console.error("Data load error", e);
        }
    } else {
        // Default demo data for first time
        data.transactions = [
            { id: 1, name: 'Initial Balance', amt: 1000, cat: 'other', type: 'income', date: new Date().toISOString().split('T')[0] }
        ];
        saveData();
    }
}
loadData();

// ---- UTILS ----
function fmt(n) { return 'Rs ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 2000);
}

// ---- NAVIGATION ----
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(i => i.classList.remove('active'));

    const target = document.getElementById('page-' + name);
    if (target) {
        target.classList.add('active');
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(name)) btn.classList.add('active');
        });

        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = name.charAt(0).toUpperCase() + name.slice(1);

        // Render current view
        if (name === 'overview') renderAll();
        else if (name === 'budget') renderBudget();
        else if (name === 'savings') renderGoals();
        else if (name === 'recurring') renderRecurring();
        else if (name === 'loans') renderLoans();
        else if (name === 'history') renderHistory();
        else if (name === 'profile') renderProfile();

        window.scrollTo(0, 0);
    }
}

// ---- RENDERING ENGINE ----
function updateTotals() {
    const monthlyTxs = getMonthlyTransactions();
    const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
    const monthlySpent = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amt, 0);

    const allIncome = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
    const allSpent = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amt, 0);
    const totalBalance = allIncome - allSpent;

    const incomeEl = document.getElementById('totalIncome');
    const spentEl = document.getElementById('totalSpent');
    const leftEl = document.getElementById('totalLeft');

    if (incomeEl) incomeEl.textContent = fmt(monthlyIncome);
    if (spentEl) spentEl.textContent = fmt(monthlySpent);
    if (leftEl) leftEl.textContent = fmt(totalBalance);
}

function renderChart() {
    const container = document.getElementById('spendingChart');
    if (!container) return;
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(now.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
    const totals = days.map(day => data.transactions.filter(t => t.date === day && t.type === 'expense').reduce((s, t) => s + t.amt, 0));
    const max = Math.max(...totals, 500);
    container.innerHTML = totals.map(v => `<div class="chart-bar" style="height:${(v / max) * 100}%"></div>`).join('');
}

function renderInsights() {
    const el = document.getElementById('quickInsights');
    if (!el) return;
    const txs = getMonthlyTransactions().filter(t => t.type === 'expense');
    const income = getMonthlyTransactions().filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
    const spent = txs.reduce((s, t) => s + t.amt, 0);

    if (!txs.length) {
        el.innerHTML = '<div style="color:var(--text-dim); font-size:0.75rem; margin-top:1rem;">Waiting for spend data...</div>';
        return;
    }

    const cats = {}; txs.forEach(t => cats[t.cat] = (cats[t.cat] || 0) + t.amt);
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return;

    const top = sorted[0];
    const catInfo = CATS[top[0]] || CATS.other;
    const health = income > 0 ? Math.round((1 - (spent / income)) * 100) : 100;

    el.innerHTML = `
        <div style="margin-top:0.8rem;">
            <div style="font-size:0.55rem; color:var(--text-dim); font-weight:700; letter-spacing:1px;">TOP SPEND</div>
            <div style="font-size:0.85rem; font-weight:700; margin:0.2rem 0;">${catInfo.icon} ${catInfo.label}</div>
            <div style="color:var(--accent); font-weight:700; font-size:0.75rem;">${fmt(top[1])}</div>
        </div>
        <div style="margin-top:1.2rem;">
            <div style="font-size:0.55rem; color:var(--text-dim); font-weight:700; letter-spacing:1px;">FINANCIAL HEALTH</div>
            <div style="font-size:1.1rem; font-weight:800; color:${health > 70 ? 'var(--green)' : 'var(--amber)'};">${health}%</div>
            <div style="font-size:0.65rem; color:var(--text-dim);">${health > 70 ? 'Excellent status' : 'Needs optimization'}</div>
        </div>
    `;
}

function renderTransactions() {
    const dashList = document.getElementById('txList');
    const histList = document.getElementById('historyTxList');

    const dashSearch = document.getElementById('txSearch')?.value.toLowerCase() || '';
    const histSearch = document.getElementById('historySearch')?.value.toLowerCase() || '';

    if (dashList) {
        let txs = data.transactions.filter(t => t.name.toLowerCase().includes(dashSearch) || (CATS[t.cat] && CATS[t.cat].label.toLowerCase().includes(dashSearch)));
        if (!txs.length) dashList.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-dim); font-size:0.8rem;">No recent activity.</div>';
        else dashList.innerHTML = txs.slice(0, 10).map(t => txItemHTML(t)).join('');
    }

    if (histList) {
        let txs = data.transactions.filter(t => t.name.toLowerCase().includes(histSearch) || (CATS[t.cat] && CATS[t.cat].label.toLowerCase().includes(histSearch)));
        if (!txs.length) histList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-dim);">No transactions found.</div>';
        else histList.innerHTML = txs.map(t => txItemHTML(t)).join('');
    }
}

function txItemHTML(t) {
    const catInfo = CATS[t.cat] || CATS.other;
    return `
        <div class="bento-card" style="display:flex; align-items:center; gap:1rem; padding:1rem; margin-bottom:0.8rem; height:auto;">
            <div style="font-size:1.5rem;">${catInfo.icon}</div>
            <div style="flex:1;">
                <div style="font-weight:700;">${t.name}</div>
                <div style="font-size:0.75rem; color:var(--text-dim);">${catInfo.label} • ${t.date}</div>
            </div>
            <div style="font-weight:800; color:${t.type === 'income' ? 'var(--green)' : 'var(--red)'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amt)}</div>
            <button onclick="deleteTx(${t.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
        </div>
    `;
}

// ---- PORTAL ACTIONS ----
function renderBudget() {
    const grid = document.getElementById('budgetGrid');
    if (!grid) return;
    const txs = getMonthlyTransactions().filter(t => t.type === 'expense');
    const totals = {}; txs.forEach(t => totals[t.cat] = (totals[t.cat] || 0) + t.amt);

    const content = Object.entries(data.budgets).map(([cat, limit]) => {
        const catInfo = CATS[cat] || CATS.other;
        const spent = totals[cat] || 0;
        const pct = Math.min(100, (spent / limit) * 100);
        return `
            <div class="bento-card">
                <div class="card-label">${catInfo.icon} ${catInfo.label}</div>
                <div class="card-value" style="font-size:1.5rem;">${fmt(spent)}</div>
                <div style="font-size:0.8rem; color:var(--text-dim); margin-top:0.3rem;">Limit: ${fmt(limit)}</div>
                <div style="margin-top:1rem; height:6px; background:hsla(0,0%,100%,0.05); border-radius:10px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:${pct > 90 ? 'var(--red)' : 'var(--accent)'};"></div>
                </div>
            </div>
        `;
    }).join('');
    grid.innerHTML = content || '<div class="bento-card grid-w-4">No budgets set. Click + to add.</div>';
}

function renderGoals() {
    const grid = document.getElementById('goalsGrid');
    if (!grid) return;
    if (!data.goals.length) {
        grid.innerHTML = '<div class="bento-card grid-w-4"><div style="color:var(--text-dim); text-align:center;">No goals tracked yet. Click + to start saving!</div></div>';
        return;
    }
    grid.innerHTML = data.goals.map(g => {
        const pct = Math.min(100, (g.saved / g.target) * 100);
        return `
            <div class="bento-card">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div class="card-label">SAVINGS GOAL</div>
                    <button onclick="deleteGoal(${g.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
                </div>
                <div style="font-size:1.1rem; font-weight:700; margin-top:0.5rem;">${g.name}</div>
                <div class="card-value" style="font-size:1.6rem; color:var(--accent);">${fmt(g.saved)}</div>
                <div style="font-size:0.7rem; color:var(--text-dim);">Target: ${fmt(g.target)}</div>
                <div style="margin-top:1rem; height:4px; background:hsla(0,0%,100%,0.05); border-radius:10px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--accent); box-shadow: 0 0 10px var(--accent);"></div>
                </div>
                <div style="font-size:0.6rem; margin-top:0.4rem; text-align:right; font-weight:700;">${Math.round(pct)}%</div>
            </div>
        `;
    }).join('');
}

function deleteGoal(id) {
    if (confirm("Remove this goal?")) {
        data.goals = data.goals.filter(g => g.id !== id);
        saveData();
        renderGoals();
    }
}

function renderRecurring() {
    const el = document.getElementById('recList');
    if (!el) return;
    if (!data.recurring.length) {
        el.innerHTML = '<div class="bento-card grid-w-4"><div style="color:var(--text-dim); text-align:center;">No active subscriptions.</div></div>';
        return;
    }
    el.innerHTML = data.recurring.map(r => `
        <div class="bento-card">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div class="card-label">RECURRING BILL</div>
                <button onclick="deleteRecurring(${r.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
            </div>
            <div style="font-weight:700; margin-top:0.5rem; font-size:1.1rem;">${r.name}</div>
            <div class="card-value" style="font-size:1.4rem; color:var(--accent);">${fmt(r.amt)}<span style="font-size:0.7rem; color:var(--text-dim);">/mo</span></div>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.3rem;">Next renewal: ${r.date}</div>
            <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                <button class="btn-solar" style="flex:2; padding:0.4rem; font-size:0.65rem;" onclick="paySubscription(${r.id})">Pay Now</button>
                <button class="btn-solar outline" style="flex:1; padding:0.4rem; font-size:0.65rem;" onclick="deleteRecurring(${r.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function paySubscription(id) {
    const sub = data.recurring.find(r => r.id === id);
    if (sub) {
        data.transactions.unshift({
            id: Date.now(),
            name: `Payment: ${sub.name}`,
            amt: sub.amt,
            cat: 'subscription',
            type: 'expense',
            date: new Date().toISOString().split('T')[0]
        });
        saveData();
        renderAll();
        showToast(`Paid ${sub.name}!`);
    }
}

function deleteRecurring(id) {
    data.recurring = data.recurring.filter(r => r.id !== id);
    saveData();
    renderRecurring();
}

function renderLoans() {
    const el = document.getElementById('loanList');
    if (!el) return;
    if (!data.loans.length) {
        el.innerHTML = '<div class="bento-card grid-w-4"><div style="color:var(--text-dim); text-align:center;">No active loans or debts.</div></div>';
        return;
    }
    el.innerHTML = data.loans.map(l => {
        const isDebt = l.type === 'debt';
        return `
            <div class="bento-card">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div class="card-label" style="color:${isDebt ? 'var(--red)' : 'var(--green)'}">${isDebt ? '🚨 I OWE' : '💰 OWES ME'}</div>
                    <button onclick="deleteLoan(${l.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
                </div>
                <div style="font-weight:700; margin-top:0.8rem; font-size:1.1rem;">${l.person || 'Unknown'}</div>
                <div style="font-size:0.7rem; color:var(--text-dim);">${l.name}</div>
                <div class="card-value" style="font-size:1.6rem; color:${isDebt ? 'var(--red)' : 'var(--green)'}">${fmt(l.amt)}</div>
                <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.3rem;">Due: ${l.date || 'No date'}</div>
                <button class="btn-solar" style="width:100%; margin-top:1rem; padding:0.5rem; font-size:0.7rem;" onclick="deleteLoan(${l.id})">Settle</button>
            </div>
        `;
    }).join('');
}

function deleteLoan(id) {
    data.loans = data.loans.filter(l => l.id !== id);
    saveData();
    renderLoans();
}

function renderHistory() { renderTransactions(); }

// ---- CORE ACTIONS ----
const CAT_OPTIONS = {
    expense: `
        <option value="food">🍜 Food</option>
        <option value="transport">🚌 Travel</option>
        <option value="study">📚 Study</option>
        <option value="entertainment">🎮 Play</option>
        <option value="health">💊 Health</option>
        <option value="shopping">🛍️ Shop</option>
        <option value="other">📦 Other</option>
    `,
    income: `
        <option value="allowance">💰 Allowance</option>
        <option value="salary">💼 Salary</option>
        <option value="gift">🎁 Gift</option>
        <option value="refund">🔙 Refund</option>
        <option value="savings">🏦 Savings</option>
        <option value="other">📦 Other</option>
    `
};

function setTxType(type, btn) {
    txType = type;
    document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const catSelect = document.getElementById('txCat');
    if (catSelect) catSelect.innerHTML = CAT_OPTIONS[type];
}

function addTransaction() {
    const nameEl = document.getElementById('txName');
    const amtEl = document.getElementById('txAmt');
    const catEl = document.getElementById('txCat');

    const name = nameEl.value;
    const amt = parseFloat(amtEl.value);
    const cat = catEl.value;

    if (!name || isNaN(amt)) return;

    data.transactions.unshift({
        id: Date.now(),
        name, amt, cat, type: txType,
        date: new Date().toISOString().split('T')[0]
    });
    saveData();
    nameEl.value = '';
    amtEl.value = '';
    renderAll();
    showToast(`${txType.charAt(0).toUpperCase() + txType.slice(1)} added!`);
}

function deleteTx(id) {
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveData();
    renderAll();
}

function saveBudget() {
    const cat = document.getElementById('budgetCat').value;
    const amt = parseFloat(document.getElementById('budgetAmt').value);
    if (cat && !isNaN(amt)) {
        data.budgets[cat] = amt;
        saveData();
        closeModal('budgetModal');
        renderBudget();
    }
}

function saveGoal() {
    const name = document.getElementById('goalName').value;
    const target = parseFloat(document.getElementById('goalTarget').value);
    const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
    if (name && !isNaN(target)) {
        data.goals.unshift({ id: Date.now(), name, target, saved });
        saveData();
        closeModal('goalModal');
        renderGoals();
    }
}

function saveRecurring() {
    const name = document.getElementById('recName').value;
    const amt = parseFloat(document.getElementById('recAmt').value);
    const date = document.getElementById('recDate').value;
    if (name && !isNaN(amt)) {
        data.recurring.unshift({ id: Date.now(), name, amt, date });
        saveData();
        closeModal('recModal');
        renderRecurring();
    }
}

function saveLoan() {
    const person = document.getElementById('loanPerson').value;
    const name = document.getElementById('loanName').value;
    const amt = parseFloat(document.getElementById('loanAmt').value);
    const type = document.getElementById('loanType').value;
    const date = document.getElementById('loanDate').value;
    if (person && !isNaN(amt)) {
        data.loans.unshift({ id: Date.now(), person, name, amt, type, date });
        saveData();
        closeModal('loanModal');
        renderLoans();
    }
}

function renderProfile() {
    if (!data.profile) data.profile = {};
    const name = data.profile.name || (currentUser ? currentUser.name : 'User');
    const email = data.profile.email || (currentUser ? currentUser.email : '');

    const nameInput = document.getElementById('profName');
    const emailInput = document.getElementById('profEmail');
    const phoneInput = document.getElementById('profPhone');

    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;
    if (phoneInput) phoneInput.value = data.profile.phone || '';

    const display = document.getElementById('profileDisplay');
    if (display) {
        if (data.profile.avatar) {
            display.innerHTML = `<img src="${data.profile.avatar}" alt="Profile" style="width:100%; height:100%; object-fit:cover;" />`;
        } else {
            display.innerHTML = `<span id="avatarInitial" style="font-size:2rem; font-weight:800; color:var(--accent);">${name.charAt(0).toUpperCase()}</span>`;
        }
    }

    const fAvatar = document.getElementById('footerAvatar');
    const fName = document.getElementById('footerName');
    if (fAvatar) {
        if (data.profile.avatar) {
            fAvatar.innerHTML = `<img src="${data.profile.avatar}" style="width:100%; height:100%; object-fit:cover;" />`;
        } else {
            fAvatar.textContent = name.charAt(0).toUpperCase();
            fAvatar.style.fontWeight = '800';
        }
    }
    if (fName) fName.textContent = name;
}

function saveProfile() {
    data.profile = {
        name: document.getElementById('profName').value,
        email: document.getElementById('profEmail').value,
        phone: document.getElementById('profPhone').value,
        avatar: data.profile ? data.profile.avatar : null
    };
    saveData();
    renderProfile();
    showToast("Profile Saved!");
}

function handleAvatar(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!data.profile) data.profile = {};
            data.profile.avatar = e.target.result;
            saveData();
            renderProfile();
        };
        reader.readAsDataURL(file);
    }
}

function clearAllData() {
    if (confirm("Delete all data?")) {
        data = { transactions: [], budgets: {}, splits: [], goals: [], recurring: [], loans: [], profile: {} };
        saveData();
        location.reload();
    }
}

function getMonthlyTransactions() {
    const now = new Date();
    return data.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
}

function renderAll() {
    updateTotals();
    renderChart();
    renderTransactions();
    renderInsights();
    renderProfile();
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    if (sessionStorage.getItem('uniwallet_show_welcome') === 'true') {
        openModal('welcomeModal');
        sessionStorage.removeItem('uniwallet_show_welcome');
    }
});