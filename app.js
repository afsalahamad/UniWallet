// Solaris V2 - Professional Sidebar Dashboard Logic
const currentUser = requireAuth();
if (!currentUser) {
  document.body.style.display = 'none';
  throw new Error('UniWallet: Not authenticated.');
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
    name: currentUser.name || '',
    phone: '',
    avatar: null
  }
};

let txType = 'expense';
const DATA_KEY = 'uniwallet_data_' + currentUser.id;

const CATS = {
  food:          { label:'Food',          icon:'🍜', color:'#10b981' },
  transport:     { label:'Transport',     icon:'🚌', color:'#3b82f6' },
  study:         { label:'Study',         icon:'📚', color:'#6366f1' },
  entertainment: { label:'Game',          icon:'🎮', color:'#f59e0b' },
  health:        { label:'Health',        icon:'💊', color:'#ef4444' },
  shopping:      { label:'Shop',          icon:'🛍️', color:'#ec4899' },
  subscription:  { label:'Subscription',  icon:'🔄', color:'#8b5cf6' },
  other:         { label:'Other',         icon:'📦', color:'#94a3b8' },
};

function saveData() { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
function loadData() {
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) {
    try { 
      data = JSON.parse(saved); 
      // Ensure arrays and objects exist
      if(!data.transactions) data.transactions = [];
      if(!data.budgets) data.budgets = {};
      if(!data.goals) data.goals = [];
      if(!data.splits) data.splits = [];
      if(!data.recurring) data.recurring = [];
      if(!data.loans) data.loans = [];
      if(!data.profile) data.profile = {};

      // Sync Profile with Signup data if empty
      if (!data.profile.name) data.profile.name = currentUser.name || '';
      if (!data.profile.email) data.profile.email = currentUser.email || '';
    } catch(e) { console.error("Data load error", e); }
  } else {
    // Default demo data for first time
    data.transactions = [
      { id:1, name:'Initial Balance', amt:1000, cat:'other', type:'income', date:new Date().toISOString().split('T')[0] }
    ];
    saveData();
  }
}
loadData();

// ---- UTILS ----
function fmt(n) { return 'Rs ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2000);
}

// ---- NAVIGATION ----
function showPage(name) {
  // Update UI State
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
<<<<<<< HEAD
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(i => i.classList.remove('active'));
=======
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
>>>>>>> e9b26a20786d659e00371142d7fc0511e3481b03

  const target = document.getElementById('page-' + name);
  if (target) {
    target.classList.add('active');
    // Find the button that matches the name
<<<<<<< HEAD
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
=======
    document.querySelectorAll('.nav-item').forEach(btn => {
>>>>>>> e9b26a20786d659e00371142d7fc0511e3481b03
        if(btn.onclick && btn.onclick.toString().includes(name)) btn.classList.add('active');
    });
    
    // Update header title
    const titleEl = document.getElementById('pageTitle');
    if(titleEl) titleEl.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Render specific portal data
    if (name === 'overview') renderAll();
    else if (name === 'budget') renderBudget();
    else if (name === 'split') renderSplits();
    else if (name === 'savings') renderGoals();
    else if (name === 'recurring') renderRecurring();
    else if (name === 'loans') renderLoans();
    else if (name === 'history') renderHistory();
    else if (name === 'guide') { /* Static */ }
    else if (name === 'profile') renderProfile();
    
    window.scrollTo(0,0);
  }
}

// ---- RENDERING ENGINE ----
function updateTotals() {
  // Current Month Data
  const monthlyTxs = getMonthlyTransactions();
  const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
  const monthlySpent = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amt, 0);
  
  // All-Time Balance Calculation
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
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(now.getDate() - (6-i));
    return d.toISOString().split('T')[0];
  });
  const totals = days.map(day => data.transactions.filter(t => t.date === day && t.type === 'expense').reduce((s,t)=>s+t.amt,0));
  const max = Math.max(...totals, 500);
  container.innerHTML = totals.map(v => `<div class="chart-bar" style="height:${(v/max)*100}%"></div>`).join('');
}

function renderInsights() {
  const el = document.getElementById('quickInsights');
  if (!el) return;
  const txs = getMonthlyTransactions().filter(t=>t.type==='expense');
  const income = getMonthlyTransactions().filter(t=>t.type==='income').reduce((s,t)=>s+t.amt,0);
  const spent = txs.reduce((s,t)=>s+t.amt,0);

  if (!txs.length) { 
    el.innerHTML = '<div style="color:var(--text-dim); font-size:0.75rem; margin-top:1rem;">Waiting for spend data...</div>'; 
    return; 
  }

  const cats = {}; txs.forEach(t => cats[t.cat] = (cats[t.cat]||0) + t.amt);
  const top = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
  const health = income > 0 ? Math.round((1 - (spent/income)) * 100) : 100;

  el.innerHTML = `
    <div style="margin-top:0.8rem;">
      <div style="font-size:0.55rem; color:var(--text-dim); font-weight:700; letter-spacing:1px;">TOP SPEND</div>
      <div style="font-size:0.85rem; font-weight:700; margin:0.2rem 0;">${CATS[top[0]].icon} ${CATS[top[0]].label}</div>
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
  
  // Render Dashboard List (Latest 10)
  if (dashList) {
    let txs = data.transactions.filter(t => t.name.toLowerCase().includes(dashSearch) || CATS[t.cat].label.toLowerCase().includes(dashSearch));
    if (!txs.length) dashList.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-dim); font-size:0.8rem;">No recent activity.</div>';
    else dashList.innerHTML = txs.slice(0, 10).map(t => txItemHTML(t)).join('');
  }
  
  // Render History List (All Searchable)
  if (histList) {
    let txs = data.transactions.filter(t => t.name.toLowerCase().includes(histSearch) || CATS[t.cat].label.toLowerCase().includes(histSearch));
    if (!txs.length) histList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-dim);">No transactions found.</div>';
    else histList.innerHTML = txs.map(t => txItemHTML(t)).join('');
  }
}

function txItemHTML(t) {
  return `
    <div class="bento-card" style="display:flex; align-items:center; gap:1rem; padding:1rem; margin-bottom:0.8rem; height:auto;">
      <div style="font-size:1.5rem;">${CATS[t.cat].icon}</div>
      <div style="flex:1;">
        <div style="font-weight:700;">${t.name}</div>
        <div style="font-size:0.75rem; color:var(--text-dim);">${CATS[t.cat].label} • ${t.date}</div>
      </div>
      <div style="font-weight:800; color:${t.type==='income'?'var(--green)':'var(--red)'}">${t.type==='income'?'+':'-'}${fmt(t.amt)}</div>
      <button onclick="deleteTx(${t.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
    </div>
  `;
}

// ---- PORTAL SPECIFIC ----
function renderBudget() {
  const grid = document.getElementById('budgetGrid');
  if(!grid) return;
  const txs = getMonthlyTransactions().filter(t=>t.type==='expense');
  const totals = {}; txs.forEach(t => totals[t.cat] = (totals[t.cat]||0) + t.amt);
  
  const content = Object.entries(data.budgets).map(([cat, limit]) => {
    const spent = totals[cat] || 0;
    const pct = Math.min(100, (spent/limit)*100);
    return `
      <div class="bento-card">
        <div class="card-label">${CATS[cat].icon} ${CATS[cat].label}</div>
        <div class="card-value" style="font-size:1.5rem;">${fmt(spent)}</div>
        <div style="font-size:0.8rem; color:var(--text-dim); margin-top:0.3rem;">Limit: ${fmt(limit)}</div>
        <div style="margin-top:1rem; height:6px; background:hsla(0,0%,100%,0.05); border-radius:10px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${pct>90?'var(--red)':'var(--accent)'};"></div>
        </div>
      </div>
    `;
  }).join('');
  grid.innerHTML = content || '<div class="bento-card grid-w-4">No budgets set. Click + to add.</div>';
}

function renderGoals() {
  const grid = document.getElementById('goalsGrid');
  if(!grid) return;
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
  if(confirm("Remove this goal?")) {
    data.goals = data.goals.filter(g => g.id !== id);
    saveData();
    renderGoals();
  }
}

// Dummy functions for remaining portals to prevent errors
function renderSplits() {
  const el = document.getElementById('splitList');
  if(!el) return;
  if (!data.splits.length) { 
    el.innerHTML = '<div class="bento-card grid-w-4"><div style="color:var(--text-dim); text-align:center;">No active splits. Share the burden!</div></div>'; 
    return; 
  }
  el.innerHTML = data.splits.map(s => {
    const share = s.amt / (s.people.length + 1);
    return `
      <div class="bento-card">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div>
            <div class="card-label">SPLIT BILL</div>
            <div style="font-weight:700; margin-top:0.5rem;">${s.name}</div>
          </div>
          <button onclick="deleteSplit(${s.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
        </div>
        <div class="card-value" style="font-size:1.4rem; color:var(--accent);">${fmt(s.amt)}</div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.3rem;">
          ${s.people.length} others • <strong>${fmt(share)}</strong> each
        </div>
        <div style="margin-top:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
          ${s.people.map(p => `<span class="pill" style="font-size:0.6rem;">${p}</span>`).join('')}
        </div>
        <button class="btn-solar" style="width:100%; margin-top:1.5rem; padding:0.5rem; font-size:0.7rem;" onclick="deleteSplit(${s.id})">Settle Bill</button>
      </div>
    `;
  }).join('');
}

function deleteSplit(id) {
  data.splits = data.splits.filter(s => s.id !== id);
  saveData();
  renderSplits();
  showToast("Split Settled/Removed");
}

function renderRecurring() {
  const el = document.getElementById('recList');
  if(!el) return;
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
    // Add to actual transactions
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
    renderTransactions();
    renderChart();
    showToast(`Paid ${sub.name}!`);
  }
}

function deleteRecurring(id) {
  data.recurring = data.recurring.filter(r => r.id !== id);
  saveData();
  renderRecurring();
  renderAll();
  renderTransactions();
  renderChart();
}

function renderLoans() {
  const el = document.getElementById('loanList');
  if(!el) return;
  if (!data.loans.length) { 
    el.innerHTML = '<div class="bento-card grid-w-4"><div style="color:var(--text-dim); text-align:center;">No active loans or debts. Record one below.</div></div>'; 
    return; 
  }
  el.innerHTML = data.loans.map(l => {
    const isDebt = l.type === 'debt';
    const dueDate = l.date ? new Date(l.date) : null;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let statusBadge = '';
    if (dueDate) {
      dueDate.setHours(0,0,0,0);
      if (dueDate < today) {
        statusBadge = `<span class="pill" style="background:hsla(var(--red), 0.2); color:hsl(var(--red)); border:1px solid currentColor;">⚠️ OVERDUE</span>`;
      } else if (dueDate.getTime() === today.getTime()) {
        statusBadge = `<span class="pill" style="background:hsla(var(--amber), 0.2); color:hsl(var(--amber)); border:1px solid currentColor;">🗓️ DUE TODAY</span>`;
      }
    }

    return `
      <div class="bento-card">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div>
            <div class="card-label" style="color:${isDebt?'var(--red)':'var(--green)'}">${isDebt ? '🚨 I OWE' : '💰 OWES ME'}</div>
            <div style="margin-top:0.4rem;">${statusBadge}</div>
          </div>
          <button onclick="deleteLoan(${l.id})" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
        </div>
        <div style="font-weight:700; margin-top:0.8rem; font-size:1.1rem;">${l.person || 'Unknown'}</div>
        <div style="font-size:0.7rem; color:var(--text-dim);">${l.name}</div>
        <div class="card-value" style="font-size:1.6rem; color:${isDebt?'var(--red)':'var(--green)'}">${fmt(l.amt)}</div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.3rem;">Pay by: ${l.date || 'No date'}</div>
        <button class="btn-solar" style="width:100%; margin-top:1rem; padding:0.5rem; font-size:0.7rem; background:${isDebt?'hsla(0,70%,50%,0.2)':'hsla(160,70%,50%,0.2)'}; color:${isDebt?'var(--red)':'var(--green)'}; border:1px solid currentColor;" onclick="deleteLoan(${l.id})">
          ${isDebt ? 'Settle Debt' : 'Received Payment'}
        </button>
      </div>
    `;
  }).join('');
}

function deleteLoan(id) {
  data.loans = data.loans.filter(l => l.id !== id);
  saveData();
  renderLoans();
  showToast("Loan/Debt Record Updated");
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
    <option value="salary">💼 Salary/Job</option>
    <option value="gift">🎁 Gift</option>
    <option value="refund">🔙 Refund</option>
    <option value="savings">🏦 Savings</option>
    <option value="other">📦 Other</option>
  `
};

// Add missing categories to CATS object if not present
CATS.allowance = { label:'Allowance', icon:'💰', color:'#10b981' };
CATS.salary    = { label:'Salary',    icon:'💼', color:'#10b981' };
CATS.gift      = { label:'Gift',      icon:'🎁', color:'#f59e0b' };
CATS.refund    = { label:'Refund',    icon:'🔙', color:'#3b82f6' };
CATS.savings   = { label:'Savings',   icon:'🏦', color:'#6366f1' };

function setTxType(type, btn) {
  txType = type;
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  // Dynamic Categories
  const catSelect = document.getElementById('txCat');
  if (catSelect) {
    catSelect.innerHTML = CAT_OPTIONS[type];
  }
}

function addTransaction() {
  const name = document.getElementById('txName').value;
  const amt = parseFloat(document.getElementById('txAmt').value);
  const cat = document.getElementById('txCat').value;
  if(!name || isNaN(amt)) return;
  
  data.transactions.unshift({
    id: Date.now(),
    name, amt, cat, type: txType,
    date: new Date().toISOString().split('T')[0]
  });
  saveData();
  document.getElementById('txName').value = '';
  document.getElementById('txAmt').value = '';
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
  if(cat && amt) {
    data.budgets[cat] = amt;
    saveData();
    closeModal('budgetModal');
    renderBudget();
    showToast("Budget Updated!");
  }
}

function saveSplit() {
  const name = document.getElementById('splitName').value;
  const amt = parseFloat(document.getElementById('splitAmt').value);
  const people = document.getElementById('splitPeople').value.split(',').map(p => p.trim());
  if(name && amt) {
    data.splits.unshift({ id: Date.now(), name, amt, people });
    saveData();
    closeModal('splitModal');
    renderSplits();
    showToast("Split Recorded!");
  }
}

function saveGoal() {
  const name = document.getElementById('goalName').value;
  const target = parseFloat(document.getElementById('goalTarget').value);
  const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
  if(name && target) {
    data.goals.unshift({ id: Date.now(), name, target, saved });
    saveData();
    closeModal('goalModal');
    renderGoals();
    showToast("Goal Created!");
  }
}

function saveRecurring() {
  const name = document.getElementById('recName').value;
  const amt = parseFloat(document.getElementById('recAmt').value);
  const date = document.getElementById('recDate').value;
  if(name && amt) {
    data.recurring.unshift({ id: Date.now(), name, amt, date });
    saveData();
    closeModal('recModal');
    renderRecurring();
    showToast("Subscription Added!");
  }
}

function saveLoan() {
  const person = document.getElementById('loanPerson').value;
  const name = document.getElementById('loanName').value;
  const amt = parseFloat(document.getElementById('loanAmt').value);
  const type = document.getElementById('loanType').value;
  const date = document.getElementById('loanDate').value;
  if(person && amt) {
    data.loans.unshift({ id: Date.now(), person, name, amt, type, date });
    saveData();
    closeModal('loanModal');
    renderLoans();
    showToast("Debt/Loan Recorded!");
  }
}

// ---- PROFILE ACTIONS ----
function renderProfile() {
  const name = data.profile?.name || currentUser.name || 'User';
  const email = data.profile?.email || currentUser.email || '';
  
  const nameInput = document.getElementById('profName');
  const emailInput = document.getElementById('profEmail');
  const phoneInput = document.getElementById('profPhone');

  if (nameInput) nameInput.value = name;
  if (emailInput) emailInput.value = email;
  if (phoneInput) phoneInput.value = data.profile?.phone || '';
  
  // Update Dashboard Profile Picture Display
  const display = document.getElementById('profileDisplay');
  if (display) {
    if (data.profile?.avatar) {
      display.innerHTML = `<img src="${data.profile.avatar}" alt="Profile" style="width:100%; height:100%; object-fit:cover;" />`;
    } else {
      display.innerHTML = `<span id="avatarInitial" style="font-size:2rem; font-weight:800; color:var(--accent);">${name.charAt(0).toUpperCase()}</span>`;
    }
  }

  // Update Sidebar Footer Profile Display
  const fAvatar = document.getElementById('footerAvatar');
  const fName = document.getElementById('footerName');
  const fEmail = document.getElementById('footerEmail');
  
  if (fAvatar) {
    if (data.profile?.avatar) {
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
    avatar: data.profile?.avatar
  };
  saveData();
  renderProfile();
  showToast("Identity Updated!");
}

function handleAvatar(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      data.profile.avatar = e.target.result;
      saveData();
      renderProfile();
      showToast("Avatar Updated!");
    };
    reader.readAsDataURL(file);
  }
}

function clearAllData() {
  if (confirm("🚨 DANGER ZONE: This will permanently delete all your financial records. Are you absolutely sure?")) {
    data = {
      transactions: [],
      budgets: {},
      splits: [],
      goals: [],
      recurring: [],
      loans: [],
      profile: { name: '', phone: '', avatar: null }
    };
    saveData();
    showPage('overview');
    showToast("Application Reset Complete.");
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

// ---- MODALS & INIT ----
function openModal(id) { 
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    // Ensure it's active regardless of which page is open
    el.classList.add('active-modal');
  }
}
function closeModal(id) { 
  const el = document.getElementById(id);
  if (el) el.style.display = 'none'; 
}

setInterval(() => {
  const timeEl = document.getElementById('currentTime');
  const dateEl = document.getElementById('currentDate');
  if(timeEl && dateEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
  }
}, 1000);

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  
  // Show welcome popup if flagged in session
  if (sessionStorage.getItem('uniwallet_show_welcome') === 'true') {
    openModal('welcomeModal');
    sessionStorage.removeItem('uniwallet_show_welcome');
  }
});

function exportData() {
  const csv = "Date,Description,Amount,Category,Type\n" + data.transactions.map(t => `${t.date},${t.name},${t.amt},${t.cat},${t.type}`).join("\n");
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'uniwallet_export.csv'; a.click();
}