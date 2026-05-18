const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', active: true },
  { id: 2, username: 'cashier', password: 'cashier123', role: 'cashier', active: true },
  { id: 3, username: 'captain', password: 'captain123', role: 'captain', active: true },
  { id: 4, username: 'kitchen', password: 'kitchen123', role: 'kitchen', active: true }
];

let products = [
  { id: 1, name: 'Coffee', category: 'Drinks', price: 3, description: 'قهوة ساخنة', imageUrl: '', active: true },
  { id: 2, name: 'Tea', category: 'Drinks', price: 2, description: 'شاي تقليدي', imageUrl: '', active: true },
  { id: 3, name: 'Mojito', category: 'Drinks', price: 5, description: 'مشروب بارد منعش', imageUrl: '', active: true },
  { id: 4, name: 'Burger', category: 'Food', price: 8, description: 'برغر مع بطاطا', imageUrl: '', active: true }
];

let tables = [1, 2, 3, 4, 5, 6, 7, 8].map((number, index) => ({ id: index + 1, number, name: `طاولة ${number}`, status: 'free', active: true }));
let orders = [];
let expenses = [];
let dailySales = [];
let expenseCategories = [
  { id: 1, name: 'رواتب' },
  { id: 2, name: 'إيجار' },
  { id: 3, name: 'مواد أولية' },
  { id: 4, name: 'كهرباء وماء' },
  { id: 5, name: 'صيانة' },
  { id: 6, name: 'أخرى' }
];
let settings = {
  currency: 'SYP'
};

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value) {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

function sendCsv(res, filename, rows) {
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('
');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv);
}

function sameMonth(dateValue, month) {
  return String(dateValue || '').slice(0, 7) === month;
}

function orderDate(order) {
  return String(order.createdAt || '').slice(0, 10);
}

function htmlPage(body) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cafe POS Pro</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Tahoma,Arial;background:#fbf7ef;color:#3b2f2f}.wrap{max-width:1200px;margin:auto;padding:20px}.login{max-width:420px;margin:70px auto}.top{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.brand{font-size:26px;font-weight:800;color:#6b3f22}.card{background:#fffaf2;border:1px solid #e7d2b5;border-radius:18px;padding:18px;margin-bottom:16px;box-shadow:0 8px 22px rgba(107,63,34,.09)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.nav{display:flex;gap:8px;flex-wrap:wrap}button{border:0;border-radius:10px;padding:10px 14px;background:#a47148;color:#fff;font-weight:700;cursor:pointer}button:hover{opacity:.88}.dark{background:#d8b892;color:#3b2f2f}.danger{background:#b91c1c;color:#fff}.ok{background:#6f8f57;color:#fff}.warn{background:#d39b45;color:#2d1f12}input,select{width:100%;padding:10px;margin:6px 0 12px;border-radius:10px;border:1px solid #d8b892;background:#fff;color:#3b2f2f}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}th,td{padding:9px;border-bottom:1px solid #eadcc8;text-align:right}th{background:#efe0cb;color:#5a351d}.muted{color:#7a6a5d}.hide{display:none}.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.prod{background:#fff;border:1px solid #d8b892;border-radius:14px;padding:12px}.summary{font-size:24px;font-weight:900;color:#6b3f22}.pill{display:inline-block;padding:5px 8px;border-radius:999px;background:#eadcc8;font-size:12px}.cartLine{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #eadcc8;padding:7px 0}.small{font-size:13px}
</style>
</head>
<body>${body}</body>
</html>`;
}

app.get('/', (req, res) => {
  res.send(htmlPage(`
<div class="wrap login">
  <div class="card">
    <h1>Cafe POS Pro</h1>
    <p class="muted">واجهة دخول نظام الكافيه</p>
    <label>اسم المستخدم</label>
    <input id="username" value="admin">
    <label>كلمة المرور</label>
    <input id="password" type="password" value="admin123">
    <button id="loginBtn">دخول</button>
    <p id="loginMsg" class="muted"></p>
    <p class="small muted">admin/admin123 - cashier/cashier123 - captain/captain123 - kitchen/kitchen123</p>
  </div>
</div>
<script>
document.getElementById('loginBtn').addEventListener('click', async function(){
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password}) });
  const data = await res.json();
  if(!data.ok){ document.getElementById('loginMsg').innerText = 'بيانات الدخول غير صحيحة أو المستخدم موقوف'; return; }
  localStorage.setItem('cafeUser', JSON.stringify(data.user));
  window.location.href = '/app';
});
</script>`));
});

app.get('/app', (req, res) => {
  res.send(htmlPage(`
<div class="wrap">
  <div class="top">
    <div><div class="brand">Cafe POS Pro</div><div id="userInfo" class="muted"></div></div>
    <div class="nav">
      <button class="dark" data-screen="dashboard">الرئيسية</button>
      <button class="dark nav-admin" data-screen="users">المستخدمون</button>
      <button class="dark nav-admin" data-screen="products">المنتجات</button>
      <button class="dark nav-admin" data-screen="settings">الإعدادات</button>
      <button class="dark nav-admin" data-screen="tables">الطاولات و QR</button>
      <button class="dark nav-admin nav-cashier" data-screen="reports">التقارير</button>
      <button class="dark nav-captain" data-screen="captain">الكابتن</button>
      <button class="dark nav-cashier" data-screen="cashier">المحاسب</button>
      <button class="dark nav-cashier" data-screen="dailySales">مبيعات يومية إجمالية</button>
      <button class="dark nav-kitchen" data-screen="kitchen">المطبخ</button>
      <button class="dark nav-admin nav-cashier" data-screen="expenses">المصاريف</button>
      <button class="danger" id="logoutBtn">خروج</button>
    </div>
  </div>

  <section id="dashboard" class="screen">
    <div class="grid">
      <div class="card"><h3>مبيعات الطلبات المدفوعة</h3><div id="salesTotal" class="summary">0</div></div>
      <div class="card"><h3>المبيعات اليومية الإجمالية</h3><div id="manualSalesTotal" class="summary">0</div></div>
      <div class="card"><h3>طلبات معلقة</h3><div id="pendingTotal" class="summary">0</div></div>
      <div class="card"><h3>المصاريف</h3><div id="expenseTotal" class="summary">0</div></div>
      <div class="card"><h3>صافي تقريبي</h3><div id="netTotal" class="summary">0</div></div>
    </div>
    <div class="card"><h2>آخر الطلبات</h2><div id="dashboardOrders"></div></div>
  </section>

  <section id="users" class="screen hide">
    <div class="card"><h2>إضافة مستخدم</h2><div class="row"><input id="newUsername" placeholder="اسم المستخدم"><input id="newPassword" placeholder="كلمة المرور"><select id="newRole"><option value="admin">Admin</option><option value="cashier">Cashier</option><option value="captain">Captain</option><option value="kitchen">Kitchen</option></select><button id="addUserBtn">إضافة مستخدم</button></div></div>
    <div class="card"><h2>قائمة المستخدمين</h2><div id="usersList"></div></div>
  </section>

  <section id="products" class="screen hide">
    <div class="card"><h2>إضافة منتج</h2><div class="row"><input id="productName" placeholder="اسم المنتج"><input id="productCategory" placeholder="التصنيف"><input id="productPrice" type="number" placeholder="السعر"><input id="productDescription" placeholder="وصف المنتج"><input id="productImageUrl" placeholder="رابط صورة المنتج URL"><button id="addProductBtn">إضافة منتج</button></div></div>
    <div class="card"><h2>قائمة المنتجات</h2><div id="productsList"></div></div>
  </section>

  <section id="tables" class="screen hide">
    <div class="card">
      <h2>تعريف الطاولات</h2>
      <div class="row">
        <input id="tableNumber" type="number" placeholder="رقم الطاولة">
        <input id="tableName" placeholder="اسم/وصف الطاولة مثال: طاولة خارجية 1">
        <button id="addTableBtn">إضافة طاولة</button>
      </div>
      <p class="muted">رابط QR لكل طاولة يفتح قائمة العميل مباشرة. يمكنك نسخ الرابط وتحويله إلى QR عبر أي مولد QR.</p>
      <div id="tablesList"></div>
    </div>
  </section>

  <section id="settings" class="screen hide">
    <div class="card">
      <h2>إعدادات العملة</h2>
      <div class="row">
        <select id="currencySelect">
          <option value="SYP">ليرة سورية SYP</option>
          <option value="USD">دولار USD</option>
          <option value="LBP">ليرة لبنانية LBP</option>
          <option value="EUR">يورو EUR</option>
        </select>
        <button id="saveCurrencyBtn">حفظ العملة</button>
      </div>
    </div>
    <div class="card">
      <h2>تعريف بنود المصاريف</h2>
      <div class="row">
        <input id="expenseCategoryName" placeholder="مثال: قهوة، مواد تنظيف، صيانة">
        <button id="addExpenseCategoryBtn">إضافة بند مصروف</button>
      </div>
      <div id="expenseCategoriesList"></div>
    </div>
  </section>

  <section id="captain" class="screen hide">
    <div class="card"><h2>طلبات العملاء عبر QR بانتظار اعتماد الكابتن</h2><div id="customerPendingOrders"></div></div>
    <div class="card"><h2>طلب طاولة - كابتن الصالة</h2><div class="row"><select id="captainTable"></select><button id="sendCaptainOrderBtn">إرسال الطلب للمطبخ والمحاسب</button></div><h3>المنتجات</h3><div id="captainProducts" class="products"></div><h3>سلة الكابتن</h3><div id="captainCart"></div></div>
    <div class="card"><h2>طلبات الطاولات</h2><div id="captainOrders"></div></div>
  </section>

  <section id="cashier" class="screen hide">
    <div class="card"><h2>POS المحاسب - بيع مباشر</h2><div class="row"><select id="saleType"><option value="Takeaway">Takeaway</option><option value="Delivery">Delivery</option><option value="Table">Table</option></select><input id="cashierTable" placeholder="رقم الطاولة اختياري"><button id="sendCashierSaleBtn">إنشاء بيع مدفوع</button></div><h3>المنتجات</h3><div id="cashierProducts" class="products"></div><h3>سلة المحاسب</h3><div id="cashierCart"></div></div>
    <div class="card"><h2>طلبات معلقة للدفع</h2><div id="pendingOrders"></div></div>
  </section>

  <section id="dailySales" class="screen hide">
    <div class="card"><h2>إدخال مبيعات يومية إجمالية - صلاحية المحاسب</h2><div class="row"><input id="dailySaleDate" type="date"><input id="dailySaleAmount" type="number" placeholder="إجمالي المبيعات"><input id="dailySaleNote" placeholder="ملاحظات"><button id="addDailySaleBtn">تسجيل المبيعات اليومية</button></div></div>
    <div class="card"><h2>سجل المبيعات اليومية الإجمالية</h2><div id="dailySalesList"></div></div>
  </section>

  <section id="kitchen" class="screen hide"><div class="card"><h2>شاشة المطبخ / البار</h2><div id="kitchenOrders"></div></div></section>

  <section id="expenses" class="screen hide">
    <div class="card"><h2>إضافة مصروف</h2><div class="row"><input id="expenseDate" type="date"><select id="expenseCategory"></select><input id="expenseTitle" placeholder="بيان المصروف"><input id="expenseAmount" type="number" placeholder="المبلغ"><button id="addExpenseBtn">إضافة مصروف</button></div></div>
    <div class="card"><h2>قائمة المصاريف</h2><div id="expensesList"></div></div>
  </section>

  <section id="reports" class="screen hide">
    <div class="card">
      <h2>تصدير تقارير شهرية Excel</h2>
      <p class="muted">اختر الشهر ثم صدّر التقرير المطلوب. الملفات تفتح مباشرة في Excel.</p>
      <div class="row">
        <input id="reportMonth" type="month">
        <button id="exportMonthlyBtn">تقرير المبيعات والمصاريف</button>
        <button id="exportTopProductsBtn">أكثر المنتجات مبيعاً</button>
        <button id="exportTopExpensesBtn">أكبر المصاريف</button>
        <button id="exportProfitBtn">تقرير الربح</button>
      </div>
    </div>
  </section>
</div>

<script>
let currentUser = JSON.parse(localStorage.getItem('cafeUser') || 'null');
if(!currentUser){ window.location.href = '/'; }
let state = { users: [], products: [], tables: [], orders: [], expenses: [], dailySales: [] };
let captainCart = [];
let cashierCart = [];
function money(v){ return Number(v || 0).toFixed(2) + ' ' + (state.settings?.currency || 'SYP'); }
function cartTotal(cart){ return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }
async function api(url, options){ const res = await fetch(url, options || {}); return await res.json(); }

function setupNavigation(){
  document.getElementById('userInfo').innerText = 'المستخدم: ' + currentUser.username + ' | الصلاحية: ' + currentUser.role;
  document.getElementById('logoutBtn').addEventListener('click', function(){ localStorage.removeItem('cafeUser'); window.location.href='/'; });
  document.querySelectorAll('[data-screen]').forEach(btn => btn.addEventListener('click', function(){ showScreen(btn.getAttribute('data-screen')); }));
  document.querySelectorAll('.nav-admin,.nav-cashier,.nav-captain,.nav-kitchen').forEach(x => x.style.display = 'none');
  if(currentUser.role === 'admin') document.querySelectorAll('.nav-admin,.nav-cashier,.nav-captain,.nav-kitchen').forEach(x => x.style.display = 'inline-block');
  if(currentUser.role === 'cashier') document.querySelectorAll('.nav-cashier').forEach(x => x.style.display = 'inline-block');
  if(currentUser.role === 'captain') document.querySelectorAll('.nav-captain').forEach(x => x.style.display = 'inline-block');
  if(currentUser.role === 'kitchen') document.querySelectorAll('.nav-kitchen').forEach(x => x.style.display = 'inline-block');
}
function showScreen(id){ document.querySelectorAll('.screen').forEach(s => s.classList.add('hide')); document.getElementById(id).classList.remove('hide'); loadState(); }
function renderCart(targetId, cart){ const el = document.getElementById(targetId); if(cart.length === 0){ el.innerHTML = '<p class="muted">السلة فارغة</p>'; return; } el.innerHTML = cart.map(item => '<div class="cartLine"><span>' + item.name + ' x ' + item.qty + '</span><b>' + money(item.price * item.qty) + '</b></div>').join('') + '<h3>الإجمالي: ' + money(cartTotal(cart)) + '</h3>'; }
function addToCart(type, productId){ const product = state.products.find(p => p.id === productId); if(!product) return; const cart = type === 'captain' ? captainCart : cashierCart; const existing = cart.find(i => i.id === product.id); if(existing) existing.qty += 1; else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 }); renderCart(type === 'captain' ? 'captainCart' : 'cashierCart', cart); }
function productCardHtml(product){
  const img = product.imageUrl ? '<img src="' + product.imageUrl + '" style="width:100%;height:90px;object-fit:cover;border-radius:10px;margin-bottom:8px" onerror="this.style.display=\'none\'">' : '';
  return img + '<b>' + product.name + '</b><br><span class="muted">' + product.category + '</span><br><span class="small">' + (product.description || '') + '</span><br>' + money(product.price) + '<br><br><button>إضافة</button>';
}
function renderProductButtons(){ const captain = document.getElementById('captainProducts'); const cashier = document.getElementById('cashierProducts'); captain.innerHTML = ''; cashier.innerHTML = ''; state.products.filter(p => p.active).forEach(product => { const c1 = document.createElement('div'); c1.className = 'prod'; c1.innerHTML = productCardHtml(product); c1.querySelector('button').addEventListener('click', () => addToCart('captain', product.id)); captain.appendChild(c1); const c2 = document.createElement('div'); c2.className = 'prod'; c2.innerHTML = productCardHtml(product); c2.querySelector('button').addEventListener('click', () => addToCart('cashier', product.id)); cashier.appendChild(c2); }); }
function renderCustomerPendingOrders(orders){
  if(orders.length === 0) return '<p class="muted">لا توجد طلبات عملاء بانتظار الاعتماد</p>';
  return '<table><tr><th>ID</th><th>الطاولة</th><th>الإجمالي</th><th>الأصناف</th><th>إجراء</th></tr>' + orders.map(o => '<tr><td>' + o.id + '</td><td>' + o.table + '</td><td>' + money(o.total) + '</td><td>' + o.items.map(i => i.name + ' x ' + i.qty).join('<br>') + '</td><td><button class="ok approveCustomerOrderBtn" data-id="' + o.id + '">اعتماد وإرسال للمطبخ والمحاسب</button> <button class="danger rejectCustomerOrderBtn" data-id="' + o.id + '">رفض</button></td></tr>').join('') + '</table>';
}
function renderOrders(orders, withPay){ if(orders.length === 0) return '<p class="muted">لا توجد طلبات</p>'; return '<table><tr><th>ID</th><th>النوع/الطاولة</th><th>الحالة</th><th>الدفع</th><th>الإجمالي</th><th>الأصناف</th><th>إجراء</th></tr>' + orders.map(o => { const items = o.items.map(i => i.name + ' x ' + i.qty).join('<br>'); const pay = withPay && o.paymentStatus === 'unpaid' ? '<button class="ok payBtn" data-id="' + o.id + '">دفع</button>' : ''; return '<tr><td>' + o.id + '</td><td>' + o.type + ' ' + (o.table || '') + '</td><td><span class="pill">' + o.status + '</span></td><td><span class="pill">' + o.paymentStatus + '</span></td><td>' + money(o.total) + '</td><td>' + items + '</td><td>' + pay + '</td></tr>'; }).join('') + '</table>'; }
function bindButtons(){ document.querySelectorAll('.payBtn').forEach(btn => btn.addEventListener('click', async function(){ await api('/api/orders/' + btn.getAttribute('data-id') + '/pay', { method: 'POST' }); await loadState(); })); document.querySelectorAll('.toggleUserBtn').forEach(btn => btn.addEventListener('click', async function(){ await api('/api/users/' + btn.getAttribute('data-id') + '/toggle', { method: 'POST' }); await loadState(); })); document.querySelectorAll('.deleteUserBtn').forEach(btn => btn.addEventListener('click', async function(){ if(confirm('حذف المستخدم؟')){ await api('/api/users/' + btn.getAttribute('data-id'), { method: 'DELETE' }); await loadState(); } })); document.querySelectorAll('.deleteTableBtn').forEach(btn => btn.addEventListener('click', async function(){ if(confirm('حذف الطاولة؟')){ await api('/api/tables/' + btn.getAttribute('data-id'), { method:'DELETE' }); await loadState(); } })); document.querySelectorAll('.deleteProductBtn').forEach(btn => btn.addEventListener('click', async function(){ if(confirm('حذف المنتج؟')){ await api('/api/products/' + btn.getAttribute('data-id'), { method:'DELETE' }); await loadState(); } })); document.querySelectorAll('.deleteExpenseCategoryBtn').forEach(btn => btn.addEventListener('click', async function(){ if(confirm('حذف بند المصروف؟')){ await api('/api/expense-categories/' + btn.getAttribute('data-id'), { method:'DELETE' }); await loadState(); } })); document.querySelectorAll('.approveCustomerOrderBtn').forEach(btn => btn.addEventListener('click', async function(){ await api('/api/orders/' + btn.getAttribute('data-id') + '/approve-customer', { method:'POST' }); await loadState(); })); document.querySelectorAll('.rejectCustomerOrderBtn').forEach(btn => btn.addEventListener('click', async function(){ await api('/api/orders/' + btn.getAttribute('data-id') + '/reject-customer', { method:'POST' }); await loadState(); })); }
function renderKitchen(){ const active = state.orders.filter(o => o.status !== 'closed'); const el = document.getElementById('kitchenOrders'); if(active.length === 0){ el.innerHTML = '<p class="muted">لا توجد طلبات حالياً</p>'; return; } el.innerHTML = active.map(o => '<div class="card"><h3>طلب #' + o.id + ' - ' + o.type + ' ' + (o.table || '') + '</h3><p>' + o.items.map(i => i.name + ' x ' + i.qty).join('<br>') + '</p><p>الحالة: ' + o.status + '</p><button class="warn statusBtn" data-id="' + o.id + '" data-status="preparing">تحضير</button> <button class="ok statusBtn" data-id="' + o.id + '" data-status="ready">جاهز</button></div>').join(''); document.querySelectorAll('.statusBtn').forEach(btn => btn.addEventListener('click', async function(){ await api('/api/orders/' + btn.getAttribute('data-id') + '/status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status: btn.getAttribute('data-status')}) }); await loadState(); })); }
async function loadState(){
  state = await api('/api/state');
  const orderPaid = state.orders.filter(o => o.paymentStatus === 'paid').reduce((s,o) => s + o.total, 0);
  const manualPaid = state.dailySales.reduce((s,e) => s + e.amount, 0);
  const expenses = state.expenses.reduce((s,e) => s + e.amount, 0);
  salesTotal.innerText = money(orderPaid); manualSalesTotal.innerText = money(manualPaid); pendingTotal.innerText = state.orders.filter(o => o.paymentStatus === 'unpaid').length; expenseTotal.innerText = money(expenses); netTotal.innerText = money(orderPaid + manualPaid - expenses);
  dashboardOrders.innerHTML = renderOrders(state.orders.slice(-10).reverse(), false);
  currencySelect.value = state.settings.currency;
  expenseCategory.innerHTML = state.expenseCategories.map(c => '<option value="' + c.name + '">' + c.name + '</option>').join('');
  expenseCategoriesList.innerHTML = '<table><tr><th>ID</th><th>بند المصروف</th><th>إجراء</th></tr>' + state.expenseCategories.map(c => '<tr><td>' + c.id + '</td><td>' + c.name + '</td><td><button class="danger deleteExpenseCategoryBtn" data-id="' + c.id + '">حذف</button></td></tr>').join('') + '</table>';
  usersList.innerHTML = '<table><tr><th>ID</th><th>المستخدم</th><th>الصلاحية</th><th>الحالة</th><th>إجراء</th></tr>' + state.users.map(u => '<tr><td>' + u.id + '</td><td>' + u.username + '</td><td>' + u.role + '</td><td>' + (u.active ? 'فعال' : 'موقوف') + '</td><td><button class="warn toggleUserBtn" data-id="' + u.id + '">' + (u.active ? 'إيقاف' : 'تفعيل') + '</button> <button class="danger deleteUserBtn" data-id="' + u.id + '">حذف</button></td></tr>').join('') + '</table>';
  productsList.innerHTML = '<table><tr><th>ID</th><th>المنتج</th><th>التصنيف</th><th>الوصف</th><th>الصورة</th><th>السعر</th><th>إجراء</th></tr>' + state.products.map(p => '<tr><td>' + p.id + '</td><td>' + p.name + '</td><td>' + p.category + '</td><td>' + (p.description || '') + '</td><td>' + (p.imageUrl ? '<a href="' + p.imageUrl + '" target="_blank">فتح</a>' : '') + '</td><td>' + money(p.price) + '</td><td><button class="danger deleteProductBtn" data-id="' + p.id + '">حذف</button></td></tr>').join('') + '</table>';
  tablesList.innerHTML = '<table><tr><th>ID</th><th>رقم الطاولة</th><th>الاسم</th><th>الحالة</th><th>رابط العميل / QR</th><th>إجراء</th></tr>' + state.tables.map(t => '<tr><td>' + t.id + '</td><td>' + t.number + '</td><td>' + (t.name || '') + '</td><td>' + t.status + '</td><td><a target="_blank" href="/menu/' + t.number + '">' + location.origin + '/menu/' + t.number + '</a></td><td><button class="danger deleteTableBtn" data-id="' + t.id + '">حذف</button></td></tr>').join('') + '</table>'; 
  customerPendingOrders.innerHTML = renderCustomerPendingOrders(state.orders.filter(o => o.source === 'customer' && o.status === 'customer_pending')); 
  captainTable.innerHTML = state.tables.map(t => '<option value="' + t.number + '">طاولة ' + t.number + ' - ' + t.status + '</option>').join('');
  renderProductButtons(); renderCart('captainCart', captainCart); renderCart('cashierCart', cashierCart);
  captainOrders.innerHTML = renderOrders(state.orders, false); pendingOrders.innerHTML = renderOrders(state.orders.filter(o => o.paymentStatus === 'unpaid'), true); renderKitchen();
  expensesList.innerHTML = '<table><tr><th>ID</th><th>التاريخ</th><th>البند</th><th>البيان</th><th>المبلغ</th><th>المستخدم</th></tr>' + state.expenses.map(e => '<tr><td>' + e.id + '</td><td>' + e.date + '</td><td>' + (e.category || '') + '</td><td>' + e.title + '</td><td>' + money(e.amount) + '</td><td>' + e.createdBy + '</td></tr>').join('') + '</table>';
  dailySalesList.innerHTML = '<table><tr><th>ID</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظات</th><th>المستخدم</th></tr>' + state.dailySales.map(s => '<tr><td>' + s.id + '</td><td>' + s.date + '</td><td>' + money(s.amount) + '</td><td>' + (s.note || '') + '</td><td>' + s.createdBy + '</td></tr>').join('') + '</table>';
  bindButtons();
}
function setupActions(){
  expenseDate.value = new Date().toISOString().slice(0,10); dailySaleDate.value = new Date().toISOString().slice(0,10);
  addUserBtn.addEventListener('click', async function(){ await api('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: newUsername.value, password: newPassword.value, role: newRole.value }) }); newUsername.value=''; newPassword.value=''; await loadState(); alert('تمت إضافة المستخدم'); });
  addProductBtn.addEventListener('click', async function(){ await api('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: productName.value, category: productCategory.value, price: Number(productPrice.value), description: productDescription.value, imageUrl: productImageUrl.value }) }); productName.value=''; productCategory.value=''; productPrice.value=''; productDescription.value=''; productImageUrl.value=''; await loadState(); alert('تمت إضافة المنتج'); });
  sendCaptainOrderBtn.addEventListener('click', async function(){ if(captainCart.length === 0){ alert('اختر منتجات أولاً'); return; } await api('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'Table', table: captainTable.value, items: captainCart, createdBy: currentUser.username, paymentStatus:'unpaid', status:'pending' }) }); captainCart = []; await loadState(); alert('تم إرسال الطلب للمحاسب والمطبخ'); });
  sendCashierSaleBtn.addEventListener('click', async function(){ if(cashierCart.length === 0){ alert('اختر منتجات أولاً'); return; } await api('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type: saleType.value, table: cashierTable.value, items: cashierCart, createdBy: currentUser.username, paymentStatus:'paid', status:'closed' }) }); cashierCart = []; cashierTable.value=''; await loadState(); alert('تم تسجيل البيع المباشر'); });
  addExpenseBtn.addEventListener('click', async function(){ await api('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: expenseDate.value, category: expenseCategory.value, title: expenseTitle.value, amount: Number(expenseAmount.value), createdBy: currentUser.username }) }); expenseTitle.value=''; expenseAmount.value=''; await loadState(); alert('تمت إضافة المصروف'); });
  saveCurrencyBtn.addEventListener('click', async function(){ await api('/api/settings/currency', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ currency: currencySelect.value }) }); await loadState(); alert('تم حفظ العملة'); });
  addExpenseCategoryBtn.addEventListener('click', async function(){ await api('/api/expense-categories', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: expenseCategoryName.value }) }); expenseCategoryName.value=''; await loadState(); alert('تمت إضافة بند المصروف'); });
  addTableBtn.addEventListener('click', async function(){ await api('/api/tables', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ number: Number(tableNumber.value), name: tableName.value }) }); tableNumber.value=''; tableName.value=''; await loadState(); alert('تمت إضافة الطاولة'); });
  reportMonth.value = new Date().toISOString().slice(0,7);
  exportMonthlyBtn.addEventListener('click', function(){ window.open('/reports/monthly?month=' + reportMonth.value, '_blank'); });
  exportTopProductsBtn.addEventListener('click', function(){ window.open('/reports/top-products?month=' + reportMonth.value, '_blank'); });
  exportTopExpensesBtn.addEventListener('click', function(){ window.open('/reports/top-expenses?month=' + reportMonth.value, '_blank'); });
  exportProfitBtn.addEventListener('click', function(){ window.open('/reports/profit?month=' + reportMonth.value, '_blank'); });
  addDailySaleBtn.addEventListener('click', async function(){ await api('/api/daily-sales', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: dailySaleDate.value, amount: Number(dailySaleAmount.value), note: dailySaleNote.value, createdBy: currentUser.username }) }); dailySaleAmount.value=''; dailySaleNote.value=''; await loadState(); alert('تم تسجيل المبيعات اليومية'); });
}
setupNavigation(); setupActions(); loadState().then(() => { if(currentUser.role === 'cashier') showScreen('cashier'); else if(currentUser.role === 'captain') showScreen('captain'); else if(currentUser.role === 'kitchen') showScreen('kitchen'); else showScreen('dashboard'); });
</script>`));
});

app.post('/api/login', (req, res) => {
  const found = users.find(u => u.username === req.body.username && u.password === req.body.password && u.active);
  if (!found) return res.json({ ok: false });
  res.json({ ok: true, user: { id: found.id, username: found.username, role: found.role } });
});
app.get('/api/state', (req, res) => res.json({ users, products, tables, orders, expenses, dailySales, expenseCategories, settings }));

app.get('/menu/:tableNumber', (req, res) => {
  const table = tables.find(t => String(t.number) === String(req.params.tableNumber) && t.active);
  if (!table) return res.status(404).send('Table not found');
  res.send(htmlPage(`
<div class="wrap">
  <div class="top"><div><div class="brand">Cafe Menu</div><div class="muted">${table.name || 'طاولة ' + table.number}</div></div></div>
  <div class="card"><h2>اختر طلبك</h2><p class="muted">سيتم إرسال الطلب إلى كابتن الصالة لاعتماده.</p><div id="customerProducts" class="products"></div><h3>سلتك</h3><div id="customerCart"></div><button id="sendCustomerOrderBtn">إرسال الطلب</button><p id="customerMsg" class="muted"></p></div>
</div>
<script>
const tableNumber = '${table.number}';
let products = ${JSON.stringify(products.filter(p => p.active))};
let cart = [];
let currency = '${settings.currency}';
function money(v){ return Number(v||0).toFixed(2) + ' ' + currency; }
function total(){ return cart.reduce((s,i)=>s+i.price*i.qty,0); }
function render(){
  const list = document.getElementById('customerProducts');
  list.innerHTML = '';
  products.forEach(p => { const d = document.createElement('div'); d.className='prod'; d.innerHTML = (p.imageUrl ? '<img src="'+p.imageUrl+'" style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px" onerror="this.style.display=\'none\'">' : '') + '<b>'+p.name+'</b><br><span class="muted">'+p.category+'</span><br><span class="small">'+(p.description||'')+'</span><br>'+money(p.price)+'<br><br><button>إضافة</button>'; d.querySelector('button').addEventListener('click',()=>{ const ex=cart.find(x=>x.id===p.id); if(ex) ex.qty++; else cart.push({id:p.id,name:p.name,price:p.price,qty:1}); renderCart(); }); list.appendChild(d); });
  renderCart();
}
function renderCart(){ const el=document.getElementById('customerCart'); if(!cart.length){el.innerHTML='<p class="muted">السلة فارغة</p>';return;} el.innerHTML = cart.map(i=>'<div class="cartLine"><span>'+i.name+' x '+i.qty+'</span><b>'+money(i.price*i.qty)+'</b></div>').join('') + '<h3>الإجمالي: '+money(total())+'</h3>'; }
document.getElementById('sendCustomerOrderBtn').addEventListener('click', async ()=>{ if(!cart.length){alert('اختر منتجات أولاً');return;} const r = await fetch('/api/customer-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table: tableNumber, items: cart})}); const data = await r.json(); cart=[]; renderCart(); document.getElementById('customerMsg').innerText='تم إرسال الطلب رقم '+data.id+' إلى كابتن الصالة'; });
render();
</script>`));
});
app.post('/api/users', (req, res) => { const user = { id: nextId(users), username: req.body.username, password: req.body.password, role: req.body.role, active: true }; users.push(user); res.json(user); });
app.post('/api/users/:id/toggle', (req, res) => { const user = users.find(u => u.id === Number(req.params.id)); if (!user) return res.status(404).json({ error: 'User not found' }); if (user.username === 'admin') return res.status(400).json({ error: 'Cannot disable admin' }); user.active = !user.active; res.json(user); });
app.delete('/api/users/:id', (req, res) => { const id = Number(req.params.id); const user = users.find(u => u.id === id); if (!user) return res.status(404).json({ error: 'User not found' }); if (user.username === 'admin') return res.status(400).json({ error: 'Cannot delete admin' }); users = users.filter(u => u.id !== id); res.json({ ok: true }); });
app.post('/api/products', (req, res) => { const product = { id: nextId(products), name: req.body.name, category: req.body.category || 'General', price: Number(req.body.price || 0), description: req.body.description || '', imageUrl: req.body.imageUrl || '', active: true }; products.push(product); res.json(product); });
app.post('/api/tables', (req, res) => { const number = Number(req.body.number); if (!number) return res.status(400).json({ error: 'Table number is required' }); const table = { id: nextId(tables), number, name: req.body.name || `طاولة ${number}`, status: 'free', active: true }; tables.push(table); res.json(table); });
app.delete('/api/tables/:id', (req, res) => { const id = Number(req.params.id); tables = tables.filter(t => t.id !== id); res.json({ ok: true }); });
app.delete('/api/products/:id', (req, res) => { const id = Number(req.params.id); products = products.filter(p => p.id !== id); res.json({ ok: true }); });
app.delete('/api/expense-categories/:id', (req, res) => { const id = Number(req.params.id); expenseCategories = expenseCategories.filter(c => c.id !== id); res.json({ ok: true }); });
app.post('/api/orders', (req, res) => { const items = req.body.items || []; const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0); const order = { id: nextId(orders), type: req.body.type || 'Table', table: req.body.table || '', items, total, status: req.body.status || 'pending', paymentStatus: req.body.paymentStatus || 'unpaid', createdBy: req.body.createdBy || 'system', createdAt: new Date().toISOString() }; orders.push(order); const table = tables.find(t => String(t.number) === String(order.table)); if (table) table.status = 'busy'; res.json(order); });
app.post('/api/orders/:id/pay', (req, res) => { const order = orders.find(o => o.id === Number(req.params.id)); if (!order) return res.status(404).json({ error: 'Order not found' }); order.paymentStatus = 'paid'; order.status = 'closed'; const table = tables.find(t => String(t.number) === String(order.table)); if (table) table.status = 'free'; res.json(order); });
app.post('/api/orders/:id/status', (req, res) => { const order = orders.find(o => o.id === Number(req.params.id)); if (!order) return res.status(404).json({ error: 'Order not found' }); order.status = req.body.status; res.json(order); });
app.post('/api/customer-orders', (req, res) => { const items = req.body.items || []; const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0); const order = { id: nextId(orders), source: 'customer', type: 'Customer QR', table: req.body.table || '', items, total, status: 'customer_pending', paymentStatus: 'unpaid', createdBy: 'customer', createdAt: new Date().toISOString() }; orders.push(order); res.json(order); });
app.post('/api/orders/:id/approve-customer', (req, res) => { const order = orders.find(o => o.id === Number(req.params.id)); if (!order) return res.status(404).json({ error: 'Order not found' }); order.status = 'pending'; order.createdBy = 'captain-approved'; const table = tables.find(t => String(t.number) === String(order.table)); if (table) table.status = 'busy'; res.json(order); });
app.post('/api/orders/:id/reject-customer', (req, res) => { const order = orders.find(o => o.id === Number(req.params.id)); if (!order) return res.status(404).json({ error: 'Order not found' }); order.status = 'rejected'; res.json(order); });
app.post('/api/expenses', (req, res) => { const expense = { id: nextId(expenses), date: req.body.date || today(), category: req.body.category || 'أخرى', title: req.body.title, amount: Number(req.body.amount || 0), createdBy: req.body.createdBy || 'system', createdAt: new Date().toISOString() }; expenses.push(expense); res.json(expense); });
app.post('/api/expense-categories', (req, res) => { const name = String(req.body.name || '').trim(); if (!name) return res.status(400).json({ error: 'Name is required' }); const category = { id: nextId(expenseCategories), name }; expenseCategories.push(category); res.json(category); });
app.post('/api/settings/currency', (req, res) => { settings.currency = req.body.currency || 'SYP'; res.json(settings); });
app.post('/api/daily-sales', (req, res) => { const sale = { id: nextId(dailySales), date: req.body.date || today(), amount: Number(req.body.amount || 0), note: req.body.note || '', createdBy: req.body.createdBy || 'system', createdAt: new Date().toISOString() }; dailySales.push(sale); res.json(sale); });

app.get('/reports/monthly', (req, res) => {
  const month = req.query.month || today().slice(0, 7);
  const monthOrders = orders.filter(o => sameMonth(orderDate(o), month) && o.paymentStatus === 'paid');
  const monthDailySales = dailySales.filter(s => sameMonth(s.date, month));
  const monthExpenses = expenses.filter(e => sameMonth(e.date, month));
  const rows = [
    ['Report', 'Monthly Sales and Expenses'],
    ['Month', month],
    ['Currency', settings.currency],
    [],
    ['Type', 'Date', 'Description', 'Amount', 'User'],
    ...monthOrders.map(o => ['Order Sale', orderDate(o), `${o.type} ${o.table || ''} #${o.id}`, o.total, o.createdBy]),
    ...monthDailySales.map(s => ['Daily Total Sale', s.date, s.note || 'Daily total', s.amount, s.createdBy]),
    ...monthExpenses.map(e => ['Expense', e.date, `${e.category || ''} - ${e.title || ''}`, -Math.abs(e.amount), e.createdBy])
  ];
  sendCsv(res, `monthly-report-${month}.csv`, rows);
});

app.get('/reports/top-products', (req, res) => {
  const month = req.query.month || today().slice(0, 7);
  const map = new Map();
  orders.filter(o => sameMonth(orderDate(o), month) && o.paymentStatus === 'paid').forEach(o => {
    (o.items || []).forEach(i => {
      const key = i.name;
      const old = map.get(key) || { product: key, quantity: 0, sales: 0 };
      old.quantity += Number(i.qty || 0);
      old.sales += Number(i.price || 0) * Number(i.qty || 0);
      map.set(key, old);
    });
  });
  const data = Array.from(map.values()).sort((a, b) => b.quantity - a.quantity || b.sales - a.sales);
  const rows = [['Report', 'Top Selling Products'], ['Month', month], ['Currency', settings.currency], [], ['Product', 'Quantity Sold', 'Sales Amount'], ...data.map(x => [x.product, x.quantity, x.sales])];
  sendCsv(res, `top-products-${month}.csv`, rows);
});

app.get('/reports/top-expenses', (req, res) => {
  const month = req.query.month || today().slice(0, 7);
  const map = new Map();
  expenses.filter(e => sameMonth(e.date, month)).forEach(e => {
    const key = e.category || 'أخرى';
    const old = map.get(key) || { category: key, amount: 0, count: 0 };
    old.amount += Number(e.amount || 0);
    old.count += 1;
    map.set(key, old);
  });
  const data = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  const rows = [['Report', 'Top Expenses'], ['Month', month], ['Currency', settings.currency], [], ['Expense Category', 'Count', 'Total Amount'], ...data.map(x => [x.category, x.count, x.amount])];
  sendCsv(res, `top-expenses-${month}.csv`, rows);
});

app.get('/reports/profit', (req, res) => {
  const month = req.query.month || today().slice(0, 7);
  const orderSales = orders.filter(o => sameMonth(orderDate(o), month) && o.paymentStatus === 'paid').reduce((s, o) => s + Number(o.total || 0), 0);
  const manualSales = dailySales.filter(s => sameMonth(s.date, month)).reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalExpenses = expenses.filter(e => sameMonth(e.date, month)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalSales = orderSales + manualSales;
  const profit = totalSales - totalExpenses;
  const margin = totalSales ? (profit / totalSales) * 100 : 0;
  const rows = [
    ['Report', 'Profit Report'],
    ['Month', month],
    ['Currency', settings.currency],
    [],
    ['Metric', 'Amount'],
    ['Paid Order Sales', orderSales],
    ['Manual Daily Sales', manualSales],
    ['Total Sales', totalSales],
    ['Total Expenses', totalExpenses],
    ['Net Profit', profit],
    ['Profit Margin %', margin.toFixed(2)]
  ];
  sendCsv(res, `profit-report-${month}.csv`, rows);
});
app.listen(PORT, '0.0.0.0', () => console.log(`Cafe POS Pro updated UI running on port ${PORT}`));
