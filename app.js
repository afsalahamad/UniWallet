// UniWallet V2 - Professional SaaS Dashboard Logic with Lucide Icons Integration

// ---- CLOCK & GREETING LOGIC ----
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

function updateGreeting() {
    const greetingEl = document.getElementById('headerGreeting');
    const userSpan = document.getElementById('headerUserName');
    const name = (data.profile && data.profile.name) ? data.profile.name : (currentUser ? (currentUser.name || 'User') : 'User');
    
    if (userSpan) userSpan.textContent = name;

    if (greetingEl) {
        const hour = new Date().getHours();
        let timePhrase = "Good Evening";
        if (hour < 12) timePhrase = "Good Morning";
        else if (hour < 18) timePhrase = "Good Afternoon";
        
        greetingEl.innerHTML = `${timePhrase}, <span id="headerUserName">${name}</span> 👋`;
    }
}

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
let activeGoalDepositId = null;
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
    if (DATA_KEY) {
        try {
            localStorage.setItem(DATA_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Save error:", e);
            showToast("Storage quota limit reached.");
        }
    }
}

function loadData() {
    if (!DATA_KEY) return;
    const saved = localStorage.getItem(DATA_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            data = { ...data, ...parsed };
            if (!data.transactions) data.transactions = [];
            if (!data.budgets) data.budgets = {};
            if (!data.goals) data.goals = [];
            if (!data.splits) data.splits = [];
            if (!data.recurring) data.recurring = [];
            if (!data.loans) data.loans = [];
            if (!data.profile) data.profile = {};

            if (!data.profile.name && currentUser) data.profile.name = currentUser.name || '';
            if (!data.profile.email && currentUser) data.profile.email = currentUser.email || '';
        } catch (e) {
            console.error("Data load error", e);
        }
    } else {
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
    setTimeout(() => { t.style.display = 'none'; }, 2200);
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
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

        const pageTitles = {
            overview: 'Dashboard',
            budget: 'Budget Planner',
            savings: 'Financial Goals',
            recurring: 'Subscriptions & Bills',
            loans: 'Loans & Debt',
            history: 'Transaction History',
            guide: 'System Guide',
            profile: 'Identity & Settings'
        };
        const mobileTitleEl = document.getElementById('mobilePageTitle');
        if (mobileTitleEl && pageTitles[name]) {
            mobileTitleEl.textContent = pageTitles[name];
        }

        const appHeader = document.querySelector('.app-header');
        if (appHeader) {
            if (name === 'overview') {
                appHeader.classList.remove('non-overview-header');
            } else {
                appHeader.classList.add('non-overview-header');
            }
        }

        if (name === 'overview') renderAll();
        else if (name === 'budget') renderBudget();
        else if (name === 'savings') renderGoals();
        else if (name === 'recurring') renderRecurring();
        else if (name === 'loans') renderLoans();
        else if (name === 'history') renderHistory();
        else if (name === 'profile') renderProfile();

        window.scrollTo(0, 0);
        refreshIcons();
    }
}

function quickLogAction(type) {
    showPage('overview');
    const tabs = document.querySelectorAll('.type-tab');
    if (tabs.length >= 2) {
        const targetTab = type === 'expense' ? tabs[0] : tabs[1];
        setTxType(type, targetTab);
    } else {
        setTxType(type, null);
    }
    const nameEl = document.getElementById('txName');
    if (nameEl) {
        nameEl.focus();
        nameEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    container.innerHTML = totals.map(v => `<div class="chart-bar" style="height:${Math.max(10, (v / max) * 100)}%" title="${fmt(v)}"></div>`).join('');
}

function renderInsights() {
    const el = document.getElementById('quickInsights');
    if (!el) return;
    const txs = getMonthlyTransactions().filter(t => t.type === 'expense');
    const income = getMonthlyTransactions().filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
    const spent = txs.reduce((s, t) => s + t.amt, 0);

    if (!txs.length) {
        el.innerHTML = '<div style="color:var(--text-secondary); font-size:0.8rem; margin-top:0.5rem;">Waiting for spending data...</div>';
        return;
    }

    const cats = {}; txs.forEach(t => cats[t.cat] = (cats[t.cat] || 0) + t.amt);
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return;

    const top = sorted[0];
    const catInfo = CATS[top[0]] || CATS.other;
    const health = income > 0 ? Math.round((1 - (spent / income)) * 100) : 100;

    el.innerHTML = `
        <div style="font-size:0.7rem; color:var(--text-secondary); font-weight:600;">Top Spend: <strong style="color:var(--text-primary);">${catInfo.icon} ${catInfo.label}</strong></div>
        <div style="font-size:0.9rem; font-weight:800; color:${health > 70 ? 'var(--success)' : 'var(--warning)'}; margin-top:0.2rem;">${health}% Financial Health</div>
    `;
}

function renderTransactions() {
    const dashList = document.getElementById('txList');
    const histList = document.getElementById('historyTxList');

    const dashSearch = document.getElementById('txSearch')?.value.toLowerCase() || '';
    const histSearch = document.getElementById('historySearch')?.value.toLowerCase() || '';

    if (dashList) {
        let txs = data.transactions.filter(t => t.name.toLowerCase().includes(dashSearch) || (CATS[t.cat] && CATS[t.cat].label.toLowerCase().includes(dashSearch)));
        if (!txs.length) dashList.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-secondary); font-size:0.85rem; background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-color);">No recent activity found.</div>';
        else dashList.innerHTML = txs.slice(0, 10).map(t => txItemHTML(t)).join('');
    }

    if (histList) {
        let txs = data.transactions.filter(t => t.name.toLowerCase().includes(histSearch) || (CATS[t.cat] && CATS[t.cat].label.toLowerCase().includes(histSearch)));
        if (!txs.length) histList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-secondary); background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-color);">No transactions match your search query.</div>';
        else histList.innerHTML = txs.map(t => txItemHTML(t)).join('');
    }
    refreshIcons();
}

function txItemHTML(t) {
    const catInfo = CATS[t.cat] || CATS.other;
    const isIncome = t.type === 'income';
    return `
        <div class="tx-item">
            <div class="tx-icon-wrapper">
                ${catInfo.icon}
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:0.95rem; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${t.name}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.15rem;">${catInfo.label} • ${t.date}</div>
            </div>
            <div style="font-weight:700; font-size:0.95rem; color:${isIncome ? 'var(--success)' : 'var(--danger)'}; text-align:right; margin-right:0.5rem;">
                ${isIncome ? '+' : '-'}${fmt(t.amt)}
            </div>
            <button class="tx-delete-btn" onclick="deleteTx(${t.id})" title="Delete entry">✕</button>
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
        const isOver = pct > 90;
        return `
            <div class="bento-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="card-label">${catInfo.icon} ${catInfo.label}</div>
                    <span class="pill" style="background:${isOver ? 'var(--danger-bg)' : 'var(--primary-light)'}; color:${isOver ? 'var(--danger)' : 'var(--primary)'}">${Math.round(pct)}%</span>
                </div>
                <div class="card-value" style="font-size:1.6rem; margin-top:0.6rem;">${fmt(spent)}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">Budget Limit: ${fmt(limit)}</div>
                <div style="margin-top:1.25rem; height:8px; background:var(--bg-input); border-radius:10px; overflow:hidden; border:1px solid var(--border-color);">
                    <div style="width:${pct}%; height:100%; background:${isOver ? 'var(--danger)' : 'var(--primary)'}; border-radius:10px; transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;
    }).join('');
    grid.innerHTML = content || '<div class="bento-card grid-w-4" style="text-align:center; color:var(--text-secondary); padding:2rem;">No budgets set yet. Click + Add Budget to define spending limits.</div>';
    refreshIcons();
}

function renderGoals() {
    const grid = document.getElementById('goalsGrid');
    if (!grid) return;
    if (!data.goals.length) {
        grid.innerHTML = '<div class="bento-card grid-w-4" style="text-align:center; color:var(--text-secondary); padding:2rem;">No savings goals tracked yet. Click + Create Goal to start!</div>';
        return;
    }
    grid.innerHTML = data.goals.map(g => {
        const safeTarget = Math.max(1, parseFloat(g.target) || 0);
        const safeSaved = Math.max(0, parseFloat(g.saved) || 0);
        const rawPct = (safeSaved / safeTarget) * 100;
        const pct = Math.min(100, rawPct);
        const isComplete = safeSaved >= safeTarget;

        return `
            <div class="bento-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="card-label" style="color:${isComplete ? 'var(--success)' : 'var(--text-secondary)'}">${isComplete ? '🎉 GOAL ACHIEVED' : 'SAVINGS GOAL'}</div>
                    <button class="tx-delete-btn" onclick="deleteGoal(${g.id})" title="Remove goal">✕</button>
                </div>
                <div style="font-size:1.1rem; font-weight:700; margin-top:0.6rem; color:var(--text-primary);">${g.name}</div>
                <div class="card-value" style="font-size:1.6rem; color:${isComplete ? 'var(--success)' : 'var(--primary)'};">${fmt(safeSaved)}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Target Amount: ${fmt(safeTarget)}</div>
                <div style="margin-top:1.25rem; height:8px; background:var(--bg-input); border-radius:10px; overflow:hidden; border:1px solid var(--border-color);">
                    <div style="width:${pct}%; height:100%; background:${isComplete ? 'var(--success)' : 'var(--primary)'}; border-radius:10px; transition: width 0.4s ease;"></div>
                </div>
                <div style="font-size:0.7rem; margin-top:0.5rem; text-align:right; font-weight:700; color:var(--text-secondary);">${Math.round(rawPct)}% Saved</div>
                <div style="margin-top:1.15rem;">
                    <button class="btn-solar" style="width:100%; padding:0.55rem; font-size:0.8rem;" onclick="depositToGoal(${g.id})">+ Add Money</button>
                </div>
            </div>
        `;
    }).join('');
    refreshIcons();
}

function depositToGoal(id) {
    activeGoalDepositId = id;
    const goal = data.goals.find(g => g.id === id);
    const errEl = document.getElementById('goalDepositError');
    const amtEl = document.getElementById('goalDepositAmt');
    
    if (errEl) errEl.style.display = 'none';
    if (amtEl) amtEl.value = '';
    
    openModal('goalDepositModal');
    setTimeout(() => {
        if (amtEl) amtEl.focus();
    }, 150);
}

function saveGoalDeposit() {
    if (!activeGoalDepositId) return;
    const goal = data.goals.find(g => g.id === activeGoalDepositId);
    if (!goal) return;

    const amtEl = document.getElementById('goalDepositAmt');
    const errEl = document.getElementById('goalDepositError');
    const amt = parseFloat(amtEl ? amtEl.value : 0);

    if (isNaN(amt) || amt <= 0) {
        if (errEl) {
            errEl.textContent = "Please enter a valid amount greater than 0.";
            errEl.style.display = 'block';
        }
        return;
    }

    goal.saved = Math.max(0, (parseFloat(goal.saved) || 0) + amt);
    saveData();
    closeModal('goalDepositModal');
    renderGoals();
    showToast(`Added ${fmt(amt)} to ${goal.name}!`);
    activeGoalDepositId = null;
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
        el.innerHTML = '<div class="bento-card grid-w-4" style="text-align:center; color:var(--text-secondary); padding:2rem;">No active subscriptions. Click + Add Subscription to track bills.</div>';
        return;
    }
    el.innerHTML = data.recurring.map(r => `
        <div class="bento-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="card-label">RECURRING SERVICE</div>
                <button class="tx-delete-btn" onclick="deleteRecurring(${r.id})" title="Remove service">✕</button>
            </div>
            <div style="font-weight:700; margin-top:0.6rem; font-size:1.15rem; color:var(--text-primary);">${r.name}</div>
            <div class="card-value" style="font-size:1.5rem; color:var(--primary);">${fmt(r.amt)}<span style="font-size:0.75rem; color:var(--text-secondary); font-weight:500;">/mo</span></div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.3rem;">Next renewal: ${r.date || 'N/A'}</div>
            <div style="display:flex; gap:0.5rem; margin-top:1.25rem;">
                <button class="btn-solar" style="flex:2; padding:0.5rem; font-size:0.75rem;" onclick="paySubscription(${r.id})">Pay Now</button>
                <button class="btn-solar outline" style="flex:1; padding:0.5rem; font-size:0.75rem;" onclick="deleteRecurring(${r.id})">Remove</button>
            </div>
        </div>
    `).join('');
    refreshIcons();
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
        el.innerHTML = '<div class="bento-card grid-w-4" style="text-align:center; color:var(--text-secondary); padding:2rem;">No active Payables or Receivables. Click + Record Entry to track entries.</div>';
        return;
    }
    el.innerHTML = data.loans.map(l => {
        const isDebt = l.type === 'debt';
        return `
            <div class="bento-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="card-label" style="color:${isDebt ? 'var(--danger)' : 'var(--success)'}">${isDebt ? '🚨 PAYABLES' : '💰 RECEIVABLES'}</div>
                    <button class="tx-delete-btn" onclick="deleteLoan(${l.id})" title="Delete entry">✕</button>
                </div>
                <div style="font-weight:700; margin-top:0.6rem; font-size:1.15rem; color:var(--text-primary);">${l.person || 'Unknown'}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${l.name}</div>
                <div style="font-size:0.7rem; color:var(--text-dim); margin-top:0.2rem;">${isDebt ? 'Money you need to repay.' : 'Money others need to repay to you.'}</div>
                <div class="card-value" style="font-size:1.6rem; color:${isDebt ? 'var(--danger)' : 'var(--success)'}; margin-top:0.4rem;">${fmt(l.amt)}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.3rem;">Due Date: ${l.date || 'No date'}</div>
                <button class="btn-solar" style="width:100%; margin-top:1.25rem; padding:0.5rem; font-size:0.75rem; background:${isDebt ? 'var(--danger)' : 'var(--primary)'}" onclick="deleteLoan(${l.id})">Settle Entry</button>
            </div>
        `;
    }).join('');
    refreshIcons();
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
    showToast(`${txType.charAt(0).toUpperCase() + txType.slice(1)} added successfully!`);
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
    if (name && !isNaN(target) && target > 0) {
        data.goals.unshift({ id: Date.now(), name, target, saved: 0 });
        saveData();
        document.getElementById('goalName').value = '';
        document.getElementById('goalTarget').value = '';
        closeModal('goalModal');
        renderGoals();
        showToast("Savings Goal Created!");
    } else {
        showToast("Please enter a valid title and target amount.");
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
            display.innerHTML = `<span id="avatarInitial" style="font-size:2rem; font-weight:800; color:var(--primary);">${name.charAt(0).toUpperCase()}</span>`;
        }
    }

    const fAvatar = document.getElementById('footerAvatar');
    const fName = document.getElementById('footerName');
    if (fAvatar) {
        if (data.profile.avatar) {
            fAvatar.innerHTML = `<img src="${data.profile.avatar}" style="width:100%; height:100%; object-fit:cover;" />`;
        } else {
            fAvatar.textContent = name.charAt(0).toUpperCase();
            fAvatar.style.fontWeight = '700';
        }
    }
    if (fName) fName.textContent = name;
    updateGreeting();
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
    const file = input && input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast("Please select a valid image file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // Resize image to max 250x250 for crisp profile avatar with tiny LocalStorage footprint (~20KB)
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 250;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            if (!data.profile) data.profile = {};
            data.profile.avatar = compressedDataUrl;
            saveData();
            renderProfile();
            showToast("Photo uploaded successfully!");
            
            // Reset input value so re-uploading the same file works
            input.value = '';
        };
        img.onerror = function() {
            showToast("Failed to process image.");
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        showToast("Error reading file.");
    };
    reader.readAsDataURL(file);
}

function clearAllData() {
    if (confirm("Delete all UniWallet local data? This action cannot be undone.")) {
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
    updateGreeting();
    updateTotals();
    renderChart();
    renderTransactions();
    renderInsights();
    renderProfile();
    refreshIcons();
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
    refreshIcons();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('goalDepositModal');
        closeModal('goalModal');
        closeModal('budgetModal');
        closeModal('recModal');
        closeModal('loanModal');
    }
});