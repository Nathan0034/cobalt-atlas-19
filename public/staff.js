(function () {
  const loginPanel = document.getElementById('loginPanel');
  const dashboard = document.getElementById('dashboard');
  const loginBtn = document.getElementById('loginBtn');
  const staffPassword = document.getElementById('staffPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const statusText = document.getElementById('statusText');

  let pollTimer = null;

  function fmtPhone(row) {
    return `+${row.phone_country_code} ${row.phone_number}`;
  }

  function fmtBirth(row) {
    return [row.birth_year, row.birth_month, row.birth_day].filter(Boolean).join('/');
  }

  function fmtAddress(row) {
    if (row.address_type === 'INTL') {
      return row.address_detail || '';
    }
    return [row.county, row.district, row.address_detail].filter(Boolean).join(' ');
  }

  function fmtTime(iso) {
    return iso.replace('T', ' ').slice(0, 16);
  }

  async function toggleProcessed(id, processed) {
    await fetch(`/api/staff/submissions/${id}/processed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processed }),
    });
  }

  function renderRows(rows) {
    tableBody.innerHTML = '';
    emptyState.classList.toggle('hidden', rows.length > 0);

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.className = row.processed ? 'processed' : '';
      tr.innerHTML = `
        <td>${fmtTime(row.created_at)}</td>
        <td>${row.name}</td>
        <td>${row.gender === 'F' ? '女' : row.gender === 'M' ? '男' : ''}</td>
        <td>${fmtPhone(row)}</td>
        <td>${fmtBirth(row)}</td>
        <td>${row.email || ''}</td>
        <td>${fmtAddress(row)}</td>
        <td>${row.language || ''}</td>
        <td><input type="checkbox" ${row.processed ? 'checked' : ''} data-id="${row.id}"></td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll('input[type=checkbox]').forEach((cb) => {
      cb.addEventListener('change', () => toggleProcessed(cb.dataset.id, cb.checked));
    });
  }

  async function refresh() {
    const res = await fetch('/api/staff/submissions');
    if (res.status === 401) {
      showLogin();
      return;
    }
    const rows = await res.json();
    renderRows(rows);
    statusText.textContent = `共 ${rows.length} 筆・${new Date().toLocaleTimeString('zh-TW')} 更新`;
  }

  function showDashboard() {
    loginPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
    refresh();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refresh, 5000);
  }

  function showLogin() {
    if (pollTimer) clearInterval(pollTimer);
    dashboard.classList.add('hidden');
    loginPanel.classList.remove('hidden');
  }

  loginBtn.addEventListener('click', async () => {
    loginError.classList.add('hidden');
    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: staffPassword.value }),
    });
    if (res.ok) {
      showDashboard();
    } else {
      loginError.textContent = '密碼錯誤';
      loginError.classList.remove('hidden');
    }
  });

  staffPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/staff/logout', { method: 'POST' });
    showLogin();
  });

  (async function init() {
    const res = await fetch('/api/staff/session');
    const data = await res.json();
    if (data.authed) showDashboard();
  })();
})();
