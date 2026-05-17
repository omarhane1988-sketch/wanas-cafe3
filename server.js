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
  { id: 1, name: 'Coffee', category: 'Drinks', price: 3, active: true },
  { id: 2, name: 'Tea', category: 'Drinks', price: 2, active: true },
  { id: 3, name: 'Mojito', category: 'Drinks', price: 5, active: true },
  { id: 4, name: 'Burger', category: 'Food', price: 8, active: true }
];

let tables = [1, 2, 3, 4, 5, 6, 7, 8].map((number, index) => ({ id: index + 1, number, status: 'free' }));
let orders = [];
let expenses = [];

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

function htmlPage(body) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cafe POS Pro</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Tahoma,Arial;background:#0f172a;color:#f8fafc}.wrap{max-width:1200px;margin:auto;padding:20px}.login{max-width:420px;margin:70px auto}.top{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.brand{font-size:26px;font-weight:800}.card{background:#111827;border:1px solid #334155;border-radius:18px;padding:18px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.nav{display:flex;gap:8px;flex-wrap:wrap}button{border:0;border-radius:10px;padding:10px 14px;background:#38bdf8;color:#00111f;font-weight:700;cursor:pointer}button:hover{opacity:.85}.dark{background:#334155;color:#fff}.danger{background:#ef4444;color:#fff}.ok{background:#22c55e;color:#001b0a}.warn{background:#f59e0b;color:#1d1300}input,select{width:100%;padding:10px;margin:6px 0 12px;border-radius:10px;border:1px solid #334155;background:#020617;color:#fff}table{width:100%;border-collapse:collapse;background:#020617;border-radius:12px;overflow:hidden}th,td{padding:9px;border-bottom:1px solid #334155;text-align:right}th{background:#172554;color:#bae6fd}.muted{color:#94a3b8}.hide{display:none}.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.prod{background:#020617;border:1px solid #334155;border-radius:14px;padding:12px}.summary{font-size:24px;font-weight:900}.pill{display:inline-block;padding:5px 8px;border-radius:999px;background:#334155;font-size:12px}.cartLine{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #334155;padding:7px 0}.small{font-size:13px}
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
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({username, password})
  });
  const data = await res.json();
  if(!data.ok){ document.getElementById('loginMsg').innerText = 'بيانات الدخول غير صحيحة'; return; }
  localStorage.setItem('cafeUser', JSON.stringify(data.user));
  window.location.href = '/app';
});
</script>`));
});

app.get('/app', (req, res) => {
  res.send(htmlPage(`
<div class="wrap">
  <div class="top">
    <div>
      <div class="brand">Cafe POS Pro</div>
      <div id="userInfo" class="muted"></div>
    </div>
    <div class="nav">
      <button class="dark" data-screen="dashboard">الرئيسية</button>
      <button class="dark nav-admin" data-screen="users">المستخدمون</button>
      <button class="dark nav-admin" data-screen="products">المنتجات</button>
      <button class="dark nav-captain" data-screen="captain">الكابتن</button>
      <button class="dark nav-cashier" data-screen="cashier">المحاسب</button>
      <button class="dark nav-kitchen" data-screen="kitchen">المطبخ</button>
      <button class="dark nav-admin nav-cashier" data-screen="expenses">المصاريف</button>
      <button class="danger" id="logoutBtn">خروج</button>
    </div>
  </div>

  <section id="dashboard" class="screen">
    <div class="grid">
      <div class="card"><h3>المبيعات المدفوعة</h3><div id="salesTotal" class="summary">0</div></div>
      <div class="card"><h3>طلبات معلقة</h3><div id="pendingTotal" class="summary">0</div></div>
      <div class="card"><h3>المصاريف</h3><div id="expenseTotal" class="summary">0</div></div>
      <div class="card"><h3>صافي تقريبي</h3><div id="netTotal" class="summary">0</div></div>
    </div>
    <div class="card"><h2>آخر الطلبات</h2><div id="dashboardOrders"></div></div>
  </section>

  <section id="users" class="screen hide">
    <div class="card">
      <h2>إضافة مستخدم</h2>
      <div class="row">
        <input id="newUsername" placeholder="اسم المستخدم">
        <input id="newPassword" placeholder="كلمة المرور">
        <select id="newRole"><option value="admin">Admin</option><option value="cashier">Cashier</option><option value="captain">Captain</option><option value="kitchen">Kitchen</option></select>
        <button id="addUserBtn">إضافة مستخدم</button>
      </div>
    </div>
    <div class="card"><h2>قائمة المستخدمين</h2><div id="usersList"></div></div>
  </section>

  <section id="products" class="screen hide">
    <div class="card">
      <h2>إضافة منتج</h2>
      <div class="row">
        <input id="productName" placeholder="اسم المنتج">
        <input id="productCategory" placeholder="التصنيف">
        <input id="productPrice" type="number" placeholder="السعر">
        <button id="addProductBtn">إضافة منتج</button>
      </div>
    </div>
    <div class="card"><h2>قائمة المنتجات</h2><div id="productsList"></div></div>
  </section>

  <section id="captain" class="screen hide">
    <div class="card">
      <h2>طلب طاولة - كابتن الصالة</h2>
      <div class="row">
        <select id="captainTable"></select>
        <button id="sendCaptainOrderBtn">إرسال الطلب للمطبخ والمحاسب</button>
      </div>
      <h3>المنتجات</h3><div id="captainProducts" class="products"></div>
      <h3>سلة الكابتن</h3><div id="captainCart"></div>
    </div>
    <div class="card"><h2>طلبات الطاولات</h2><div id="captainOrders"></div></div>
  </section>

  <section id="cashier" class="screen hide">
    <div class="card">
      <h2>POS المحاسب - بيع مباشر</h2>
      <div class="row">
        <select id="saleType"><option value="Takeaway">Takeaway</option><option value="Delivery">Delivery</option><option value="Table">Table</option></select>
        <input id="cashierTable" placeholder="رقم الطاولة اختياري">
        <button id="sendCashierSaleBtn">إنشاء بيع مدفوع</button>
      </div>
      <h3>المنتجات</h3><div id="cashierProducts" class="products"></div>
      <h3>سلة المحاسب</h3><div id="cashierCart"></div>
    </div>
    <div class="card"><h2>طلبات معلقة للدفع</h2><div id="pendingOrders"></div></div>
  </section>

  <section id="kitchen" class="screen hide">
    <div class="card"><h2>شاشة المطبخ / البار</h2><div id="kitchenOrders"></div></div>
  </section>

  <section id="expenses" class="screen hide">
    <div class="card">
      <h2>إضافة مصروف</h2>
      <div class="row">
        <input id="expenseTitle" placeholder="بيان المصروف">
        <input id="expenseAmount" type="number" placeholder="المبلغ">
        <button id="addExpenseBtn">إضافة مصروف</button>
      </div>
    </div>
    <div class="card"><h2>قائمة المصاريف</h2><div id="expensesList"></div></div>
  </section>
</div>

<script>
let currentUser = JSON.parse(localStorage.getItem('cafeUser') || 'null');
if(!currentUser){ window.location.href = '/'; }
let state = { users: [], products: [], tables: [], orders: [], expenses: [] };
let captainCart = [];
let cashierCart = [];

function money(v){ return '$' + Number(v || 0).toFixed(2); }
function cartTotal(cart){ return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }

async function api(url, options){
  const res = await fetch(url, options || {});
  return await res.json();
}

function setupNavigation(){
  document.getElementById('userInfo').innerText = 'المستخدم: ' + currentUser.username + ' | الصلاحية: ' + currentUser.role;
  document.getElementById('logoutBtn').addEventListener('click', function(){ localStorage.removeItem('cafeUser'); window.location.href='/'; });

  document.querySelectorAll('[data-screen]').forEach(btn => {
    btn.addEventListener('click', function(){ showScreen(btn.getAttribute('data-screen')); });
  });

  document.querySelectorAll('.nav-admin,.nav-cashier,.nav-captain,.nav-kitchen').forEach(x => x.style.display = 'none');
  if(currentUser.role === 'admin') document.querySelectorAll('.nav-admin,.nav-cashier,.nav-captain,.nav-kitchen').forEach(x => x.style.display = 'inline-block');
  if(currentUser.role === 'cashier') document.querySelectorAll('.nav-cashier').forEach(x => x.style.display = 'inline-block');
  if(currentUser.role === 'captain') document.querySelectorAll('.nav-captain').forEach(x => x.style.display = 'inline-block');
  if(currentUser.role === 'kitchen') document.querySelectorAll('.nav-kitchen').forEach(x => x.style.display = 'inline-block');
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hide'));
  document.getElementById(id).classList.remove('hide');
  loadState();
}

function renderCart(targetId, cart){
  const el = document.getElementById(targetId);
  if(cart.length === 0){ el.innerHTML = '<p class="muted">السلة فارغة</p>'; return; }
  el.innerHTML = cart.map(item => '<div class="cartLine"><span>' + item.name + ' x ' + item.qty + '</span><b>' + money(item.price * item.qty) + '</b></div>').join('') + '<h3>الإجمالي: ' + money(cartTotal(cart)) + '</h3>';
}

function addToCart(type, productId){
  const product = state.products.find(p => p.id === productId);
  if(!product) return;
  const cart = type === 'captain' ? captainCart : cashierCart;
  const existing = cart.find(i => i.id === product.id);
  if(existing) existing.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  renderCart(type === 'captain' ? 'captainCart' : 'cashierCart', cart);
}

function renderProductButtons(){
  const captain = document.getElementById('captainProducts');
  const cashier = document.getElementById('cashierProducts');
  captain.innerHTML = '';
  cashier.innerHTML = '';
  state.products.forEach(product => {
    const c1 = document.createElement('div');
    c1.className = 'prod';
    c1.innerHTML = '<b>' + product.name + '</b><br><span class="muted">' + product.category + '</span><br>' + money(product.price) + '<br><br><button>إضافة</button>';
    c1.querySelector('button').addEventListener('click', () => addToCart('captain', product.id));
    captain.appendChild(c1);

    const c2 = document.createElement('div');
    c2.className = 'prod';
    c2.innerHTML = '<b>' + product.name + '</b><br><span class="muted">' + product.category + '</span><br>' + money(product.price) + '<br><br><button>إضافة</button>';
    c2.querySelector('button').addEventListener('click', () => addToCart('cashier', product.id));
    cashier.appendChild(c2);
  });
}

function renderOrders(orders, withPay){
  if(orders.length === 0) return '<p class="muted">لا توجد طلبات</p>';
  return '<table><tr><th>ID</th><th>النوع/الطاولة</th><th>الحالة</th><th>الدفع</th><th>الإجمالي</th><th>الأصناف</th><th>إجراء</th></tr>' + orders.map(o => {
    const items = o.items.map(i => i.name + ' x ' + i.qty).join('<br>');
    const pay = withPay && o.paymentStatus === 'unpaid' ? '<button class="ok payBtn" data-id="' + o.id + '">دفع</button>' : '';
    return '<tr><td>' + o.id + '</td><td>' + o.type + ' ' + (o.table || '') + '</td><td><span class="pill">' + o.status + '</span></td><td><span class="pill">' + o.paymentStatus + '</span></td><td>' + money(o.total) + '</td><td>' + items + '</td><td>' + pay + '</td></tr>';
  }).join('') + '</table>';
}

function bindPayButtons(){
  document.querySelectorAll('.payBtn').forEach(btn => {
    btn.addEventListener('click', async function(){
      await api('/api/orders/' + btn.getAttribute('data-id') + '/pay', { method: 'POST' });
      await loadState();
    });
  });
}

function renderKitchen(){
  const active = state.orders.filter(o => o.status !== 'closed');
  const el = document.getElementById('kitchenOrders');
  if(active.length === 0){ el.innerHTML = '<p class="muted">لا توجد طلبات حالياً</p>'; return; }
  el.innerHTML = active.map(o => '<div class="card"><h3>طلب #' + o.id + ' - ' + o.type + ' ' + (o.table || '') + '</h3><p>' + o.items.map(i => i.name + ' x ' + i.qty).join('<br>') + '</p><p>الحالة: ' + o.status + '</p><button class="warn statusBtn" data-id="' + o.id + '" data-status="preparing">تحضير</button> <button class="ok statusBtn" data-id="' + o.id + '" data-status="ready">جاهز</button></div>').join('');
  document.querySelectorAll('.statusBtn').forEach(btn => {
    btn.addEventListener('click', async function(){
      await api('/api/orders/' + btn.getAttribute('data-id') + '/status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status: btn.getAttribute('data-status')}) });
      await loadState();
    });
  });
}

async function loadState(){
  state = await api('/api/state');
  const paid = state.orders.filter(o => o.paymentStatus === 'paid').reduce((s,o) => s + o.total, 0);
  const expenses = state.expenses.reduce((s,e) => s + e.amount, 0);
  document.getElementById('salesTotal').innerText = money(paid);
  document.getElementById('pendingTotal').innerText = state.orders.filter(o => o.paymentStatus === 'unpaid').length;
  document.getElementById('expenseTotal').innerText = money(expenses);
  document.getElementById('netTotal').innerText = money(paid - expenses);
  document.getElementById('dashboardOrders').innerHTML = renderOrders(state.orders.slice(-10).reverse(), false);

  document.getElementById('usersList').innerHTML = '<table><tr><th>ID</th><th>المستخدم</th><th>الصلاحية</th><th>نشط</th></tr>' + state.users.map(u => '<tr><td>' + u.id + '</td><td>' + u.username + '</td><td>' + u.role + '</td><td>' + u.active + '</td></tr>').join('') + '</table>';
  document.getElementById('productsList').innerHTML = '<table><tr><th>ID</th><th>المنتج</th><th>التصنيف</th><th>السعر</th></tr>' + state.products.map(p => '<tr><td>' + p.id + '</td><td>' + p.name + '</td><td>' + p.category + '</td><td>' + money(p.price) + '</td></tr>').join('') + '</table>';
  document.getElementById('captainTable').innerHTML = state.tables.map(t => '<option value="' + t.number + '">طاولة ' + t.number + ' - ' + t.status + '</option>').join('');

  renderProductButtons();
  renderCart('captainCart', captainCart);
  renderCart('cashierCart', cashierCart);

  document.getElementById('captainOrders').innerHTML = renderOrders(state.orders, false);
  document.getElementById('pendingOrders').innerHTML = renderOrders(state.orders.filter(o => o.paymentStatus === 'unpaid'), true);
  bindPayButtons();
  renderKitchen();
  document.getElementById('expensesList').innerHTML = '<table><tr><th>ID</th><th>البيان</th><th>المبلغ</th><th>المستخدم</th></tr>' + state.expenses.map(e => '<tr><td>' + e.id + '</td><td>' + e.title + '</td><td>' + money(e.amount) + '</td><td>' + e.createdBy + '</td></tr>').join('') + '</table>';
}

function setupActions(){
  document.getElementById('addUserBtn').addEventListener('click', async function(){
    await api('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: newUsername.value, password: newPassword.value, role: newRole.value }) });
    newUsername.value=''; newPassword.value=''; await loadState(); alert('تمت إضافة المستخدم');
  });
  document.getElementById('addProductBtn').addEventListener('click', async function(){
    await api('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: productName.value, category: productCategory.value, price: Number(productPrice.value) }) });
    productName.value=''; productCategory.value=''; productPrice.value=''; await loadState(); alert('تمت إضافة المنتج');
  });
  document.getElementById('sendCaptainOrderBtn').addEventListener('click', async function(){
    if(captainCart.length === 0){ alert('اختر منتجات أولاً'); return; }
    await api('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'Table', table: captainTable.value, items: captainCart, createdBy: currentUser.username, paymentStatus:'unpaid', status:'pending' }) });
    captainCart = []; await loadState(); alert('تم إرسال الطلب للمحاسب والمطبخ');
  });
  document.getElementById('sendCashierSaleBtn').addEventListener('click', async function(){
    if(cashierCart.length === 0){ alert('اختر منتجات أولاً'); return; }
    await api('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type: saleType.value, table: cashierTable.value, items: cashierCart, createdBy: currentUser.username, paymentStatus:'paid', status:'closed' }) });
    cashierCart = []; cashierTable.value=''; await loadState(); alert('تم تسجيل البيع المباشر');
  });
  document.getElementById('addExpenseBtn').addEventListener('click', async function(){
    await api('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: expenseTitle.value, amount: Number(expenseAmount.value), createdBy: currentUser.username }) });
    expenseTitle.value=''; expenseAmount.value=''; await loadState(); alert('تمت إضافة المصروف');
  });
}

setupNavigation();
setupActions();
loadState().then(() => {
  if(currentUser.role === 'cashier') showScreen('cashier');
  else if(currentUser.role === 'captain') showScreen('captain');
  else if(currentUser.role === 'kitchen') showScreen('kitchen');
  else showScreen('dashboard');
});
</script>`));
});

app.post('/api/login', (req, res) => {
  const found = users.find(u => u.username === req.body.username && u.password === req.body.password && u.active);
  if (!found) return res.json({ ok: false });
  res.json({ ok: true, user: { id: found.id, username: found.username, role: found.role } });
});

app.get('/api/state', (req, res) => {
  res.json({ users, products, tables, orders, expenses });
});

app.post('/api/users', (req, res) => {
  const user = { id: nextId(users), username: req.body.username, password: req.body.password, role: req.body.role, active: true };
  users.push(user);
  res.json(user);
});

app.post('/api/products', (req, res) => {
  const product = { id: nextId(products), name: req.body.name, category: req.body.category || 'General', price: Number(req.body.price || 0), active: true };
  products.push(product);
  res.json(product);
});

app.post('/api/orders', (req, res) => {
  const items = req.body.items || [];
  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0);
  const order = {
    id: nextId(orders),
    type: req.body.type || 'Table',
    table: req.body.table || '',
    items,
    total,
    status: req.body.status || 'pending',
    paymentStatus: req.body.paymentStatus || 'unpaid',
    createdBy: req.body.createdBy || 'system',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  const table = tables.find(t => String(t.number) === String(order.table));
  if (table) table.status = 'busy';
  res.json(order);
});

app.post('/api/orders/:id/pay', (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.paymentStatus = 'paid';
  order.status = 'closed';
  const table = tables.find(t => String(t.number) === String(order.table));
  if (table) table.status = 'free';
  res.json(order);
});

app.post('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = req.body.status;
  res.json(order);
});

app.post('/api/expenses', (req, res) => {
  const expense = { id: nextId(expenses), title: req.body.title, amount: Number(req.body.amount || 0), createdBy: req.body.createdBy || 'system', createdAt: new Date().toISOString() };
  expenses.push(expense);
  res.json(expense);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cafe POS Pro stable UI running on port ${PORT}`);
});
