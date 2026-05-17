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

let tables = [
  { id: 1, number: 1, status: 'free' },
  { id: 2, number: 2, status: 'free' },
  { id: 3, number: 3, status: 'free' },
  { id: 4, number: 4, status: 'free' },
  { id: 5, number: 5, status: 'free' }
];

let orders = [];
let expenses = [];

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

function page(title, body) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
:root{--bg:#0f172a;--card:#111827;--card2:#1f2937;--txt:#f8fafc;--muted:#94a3b8;--accent:#38bdf8;--ok:#22c55e;--warn:#f59e0b;--bad:#ef4444;}
*{box-sizing:border-box}body{margin:0;font-family:Tahoma,Arial;background:linear-gradient(135deg,#020617,#111827);color:var(--txt)}
a{color:inherit;text-decoration:none}.wrap{max-width:1200px;margin:auto;padding:20px}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:10px;flex-wrap:wrap}.brand{font-size:26px;font-weight:800}.nav{display:flex;gap:8px;flex-wrap:wrap}.btn,button{background:var(--accent);color:#00111f;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}.btn2{background:#334155;color:white}.danger{background:var(--bad);color:white}.ok{background:var(--ok);color:#001b0a}.warn{background:var(--warn);color:#1d1300}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.card{background:rgba(17,24,39,.92);border:1px solid rgba(148,163,184,.2);border-radius:18px;padding:18px;box-shadow:0 12px 30px rgba(0,0,0,.25)}.card h2,.card h3{margin-top:0}.muted{color:var(--muted)}input,select{width:100%;padding:11px;margin:6px 0 12px;border-radius:10px;border:1px solid #334155;background:#020617;color:white}table{width:100%;border-collapse:collapse;background:rgba(15,23,42,.75);border-radius:14px;overflow:hidden}th,td{padding:10px;border-bottom:1px solid #334155;text-align:right}th{color:#bae6fd;background:#0f172a}.pill{padding:5px 8px;border-radius:999px;background:#334155;font-size:12px;display:inline-block}.login{max-width:420px;margin:70px auto}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.prod{background:#0f172a;border:1px solid #334155;border-radius:14px;padding:12px;cursor:pointer}.prod:hover{border-color:var(--accent)}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.row>*{flex:1}.hide{display:none}.summary{font-size:22px;font-weight:800}.small{font-size:13px}</style>
</head>
<body>${body}</body></html>`;
}

app.get('/', (req, res) => {
  res.send(page('Cafe POS Pro', `
  <div class="wrap login">
    <div class="card">
      <h1>Cafe POS Pro</h1>
      <p class="muted">نظام إدارة مبيعات ومصاريف وطلبات الكافيه</p>
      <label>اسم المستخدم</label><input id="u" placeholder="admin / cashier / captain / kitchen">
      <label>كلمة المرور</label><input id="p" type="password" placeholder="admin123">
      <button onclick="login()">دخول</button>
      <p id="msg" class="muted"></p>
      <hr style="border-color:#334155">
      <p class="small muted">الحسابات الافتراضية: admin/admin123 - cashier/cashier123 - captain/captain123 - kitchen/kitchen123</p>
    </div>
  </div>
<script>
async function login(){
 const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value,password:p.value})});
 const d=await r.json();
 if(!d.ok){msg.innerText='بيانات الدخول غير صحيحة';return}
 localStorage.setItem('user',JSON.stringify(d.user));
 location.href='/app';
}
</script>`));
});

app.get('/app', (req, res) => {
  res.send(page('Cafe POS Pro Dashboard', `
<div class="wrap">
  <div class="top">
    <div><div class="brand">Cafe POS Pro</div><div class="muted" id="who"></div></div>
    <div class="nav">
      <button class="btn2" onclick="show('dashboard')">الرئيسية</button>
      <button class="btn2 adminOnly" onclick="show('users')">المستخدمون</button>
      <button class="btn2 adminOnly" onclick="show('products')">المنتجات</button>
      <button class="btn2 captainOnly cashierOnly" onclick="show('orders')">طلبات الطاولات</button>
      <button class="btn2 cashierOnly" onclick="show('pos')">POS المحاسب</button>
      <button class="btn2 kitchenOnly" onclick="show('kitchen')">المطبخ</button>
      <button class="btn2 adminOnly cashierOnly" onclick="show('expenses')">المصاريف</button>
      <button class="danger" onclick="logout()">خروج</button>
    </div>
  </div>

  <section id="dashboard" class="section">
    <div class="grid">
      <div class="card"><h3>مبيعات مدفوعة</h3><div class="summary" id="paidSales">0</div></div>
      <div class="card"><h3>طلبات معلقة</h3><div class="summary" id="pendingCount">0</div></div>
      <div class="card"><h3>المصاريف</h3><div class="summary" id="expenseTotal">0</div></div>
      <div class="card"><h3>صافي تقريبي</h3><div class="summary" id="netTotal">0</div></div>
    </div>
    <br><div class="card"><h2>آخر الطلبات</h2><div id="latestOrders"></div></div>
  </section>

  <section id="users" class="section hide">
    <div class="card"><h2>إضافة مستخدم</h2>
      <div class="row"><input id="newUser" placeholder="اسم المستخدم"><input id="newPass" placeholder="كلمة المرور"><select id="newRole"><option>admin</option><option>cashier</option><option>captain</option><option>kitchen</option></select><button onclick="addUser()">إضافة</button></div>
    </div><br><div class="card"><h2>المستخدمون</h2><div id="usersTable"></div></div>
  </section>

  <section id="products" class="section hide">
    <div class="card"><h2>إضافة منتج</h2>
      <div class="row"><input id="prodName" placeholder="اسم المنتج"><input id="prodCat" placeholder="التصنيف"><input id="prodPrice" type="number" placeholder="السعر"><button onclick="addProduct()">إضافة</button></div>
    </div><br><div class="card"><h2>المنتجات</h2><div id="productsTable"></div></div>
  </section>

  <section id="orders" class="section hide">
    <div class="card"><h2>إنشاء طلب طاولة - كابتن</h2>
      <div class="row"><select id="tableNo"></select><button onclick="createCaptainOrder()">إرسال الطلب للمحاسب والمطبخ</button></div>
      <h3>اختر المنتجات</h3><div class="products" id="captainProducts"></div><h3>السلة</h3><div id="captainCart"></div>
    </div><br><div class="card"><h2>طلبات الطاولات</h2><div id="ordersTable"></div></div>
  </section>

  <section id="pos" class="section hide">
    <div class="card"><h2>POS المحاسب - بيع مباشر</h2>
      <div class="row"><select id="saleType"><option>Takeaway</option><option>Delivery</option><option>Table</option></select><input id="cashierTable" placeholder="رقم الطاولة اختياري"><button onclick="createCashierSale()">إنشاء واعتبارها مدفوعة</button></div>
      <h3>المنتجات</h3><div class="products" id="cashierProducts"></div><h3>السلة</h3><div id="cashierCart"></div>
    </div><br><div class="card"><h2>طلبات معلقة للدفع</h2><div id="pendingPayments"></div></div>
  </section>

  <section id="kitchen" class="section hide">
    <div class="card"><h2>شاشة المطبخ / البار</h2><div id="kitchenOrders"></div></div>
  </section>

  <section id="expenses" class="section hide">
    <div class="card"><h2>إضافة مصروف</h2>
      <div class="row"><input id="expTitle" placeholder="بيان المصروف"><input id="expAmount" type="number" placeholder="المبلغ"><button onclick="addExpense()">إضافة</button></div>
    </div><br><div class="card"><h2>المصاريف</h2><div id="expensesTable"></div></div>
  </section>
</div>
<script>
let user=JSON.parse(localStorage.getItem('user')||'null');
if(!user) location.href='/';
who.innerText='المستخدم: '+user.username+' | الصلاحية: '+user.role;
function logout(){localStorage.removeItem('user');location.href='/'}
function allowed(){
 document.querySelectorAll('.adminOnly,.cashierOnly,.captainOnly,.kitchenOnly').forEach(x=>x.style.display='none');
 document.querySelectorAll('.'+user.role+'Only').forEach(x=>x.style.display='inline-block');
 if(user.role==='admin') document.querySelectorAll('.adminOnly,.cashierOnly,.captainOnly,.kitchenOnly').forEach(x=>x.style.display='inline-block');
}
function show(id){document.querySelectorAll('.section').forEach(s=>s.classList.add('hide'));document.getElementById(id).classList.remove('hide');loadAll()}
let capCart=[], cashCart=[];
async function api(url,opt){let r=await fetch(url,opt);return r.json()}
function money(n){return '$'+Number(n||0).toFixed(2)}
function cartTotal(c){return c.reduce((s,i)=>s+i.price*i.qty,0)}
function renderCart(el,c){document.getElementById(el).innerHTML=c.length?'<table><tr><th>الصنف</th><th>الكمية</th><th>المجموع</th></tr>'+c.map(i=>'<tr><td>'+i.name+'</td><td>'+i.qty+'</td><td>'+money(i.price*i.qty)+'</td></tr>').join('')+'<tr><th colspan="2">الإجمالي</th><th>'+money(cartTotal(c))+'</th></tr></table>':'<p class="muted">السلة فارغة</p>'}
function addToCart(c,p,el){let x=c.find(i=>i.id===p.id); if(x)x.qty++; else c.push({...p,qty:1}); renderCart(el,c)}
async function loadAll(){
 let data=await api('/api/state');
 paidSales.innerText=money(data.orders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+o.total,0));
 pendingCount.innerText=data.orders.filter(o=>o.paymentStatus==='unpaid').length;
 expenseTotal.innerText=money(data.expenses.reduce((s,e)=>s+Number(e.amount),0));
 netTotal.innerText=money(data.orders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+o.total,0)-data.expenses.reduce((s,e)=>s+Number(e.amount),0));
 latestOrders.innerHTML=renderOrders(data.orders.slice(-8).reverse());
 usersTable.innerHTML='<table><tr><th>ID</th><th>المستخدم</th><th>الصلاحية</th><th>نشط</th></tr>'+data.users.map(u=>'<tr><td>'+u.id+'</td><td>'+u.username+'</td><td>'+u.role+'</td><td>'+u.active+'</td></tr>').join('')+'</table>';
 productsTable.innerHTML='<table><tr><th>ID</th><th>المنتج</th><th>التصنيف</th><th>السعر</th></tr>'+data.products.map(p=>'<tr><td>'+p.id+'</td><td>'+p.name+'</td><td>'+p.category+'</td><td>'+money(p.price)+'</td></tr>').join('')+'</table>';
 tableNo.innerHTML=data.tables.map(t=>'<option value="'+t.number+'">طاولة '+t.number+'</option>').join('');
 captainProducts.innerHTML=data.products.map(p=>'<div class="prod" onclick=\'addToCart(capCart,'+JSON.stringify(p)+',"captainCart")\'><b>'+p.name+'</b><br><span class="muted">'+p.category+'</span><br>'+money(p.price)+'</div>').join('');
 cashierProducts.innerHTML=data.products.map(p=>'<div class="prod" onclick=\'addToCart(cashCart,'+JSON.stringify(p)+',"cashierCart")\'><b>'+p.name+'</b><br><span class="muted">'+p.category+'</span><br>'+money(p.price)+'</div>').join('');
 ordersTable.innerHTML=renderOrders(data.orders);
 pendingPayments.innerHTML=renderOrders(data.orders.filter(o=>o.paymentStatus==='unpaid'),true);
 kitchenOrders.innerHTML=renderKitchen(data.orders.filter(o=>o.status!=='closed'));
 expensesTable.innerHTML='<table><tr><th>ID</th><th>البيان</th><th>المبلغ</th><th>المستخدم</th></tr>'+data.expenses.map(e=>'<tr><td>'+e.id+'</td><td>'+e.title+'</td><td>'+money(e.amount)+'</td><td>'+e.createdBy+'</td></tr>').join('')+'</table>';
 renderCart('captainCart',capCart);renderCart('cashierCart',cashCart);
}
function renderOrders(arr,payBtn=false){return arr.length?'<table><tr><th>ID</th><th>النوع/الطاولة</th><th>الحالة</th><th>الدفع</th><th>الإجمالي</th><th>الأصناف</th><th></th></tr>'+arr.map(o=>'<tr><td>'+o.id+'</td><td>'+o.type+' '+(o.table?o.table:'')+'</td><td><span class="pill">'+o.status+'</span></td><td><span class="pill">'+o.paymentStatus+'</span></td><td>'+money(o.total)+'</td><td>'+o.items.map(i=>i.name+' x '+i.qty).join('<br>')+'</td><td>'+(payBtn?'<button class="ok" onclick="payOrder('+o.id+')">دفع</button>':'')+'</td></tr>').join('')+'</table>':'<p class="muted">لا توجد بيانات</p>'}
function renderKitchen(arr){return arr.length?arr.map(o=>'<div class="card"><h3>طلب #'+o.id+' - '+o.type+' '+(o.table||'')+'</h3><p>'+o.items.map(i=>i.name+' x '+i.qty).join('<br>')+'</p><p>الحالة: '+o.status+'</p><button onclick="setOrderStatus('+o.id+',\'preparing\')">تحضير</button> <button class="ok" onclick="setOrderStatus('+o.id+',\'ready\')">جاهز</button></div>').join(''):'<p class="muted">لا توجد طلبات للمطبخ</p>'}
async function addUser(){await api('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:newUser.value,password:newPass.value,role:newRole.value})});newUser.value='';newPass.value='';loadAll()}
async function addProduct(){await api('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:prodName.value,category:prodCat.value,price:Number(prodPrice.value)})});prodName.value='';prodCat.value='';prodPrice.value='';loadAll()}
async function createCaptainOrder(){if(!capCart.length)return alert('اختر منتجات');await api('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'Table',table:tableNo.value,items:capCart,createdBy:user.username,paymentStatus:'unpaid',status:'pending'})});capCart=[];loadAll();alert('تم إرسال الطلب')}
async function createCashierSale(){if(!cashCart.length)return alert('اختر منتجات');await api('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:saleType.value,table:cashierTable.value,items:cashCart,createdBy:user.username,paymentStatus:'paid',status:'closed'})});cashCart=[];cashierTable.value='';loadAll();alert('تم إنشاء البيع')}
async function payOrder(id){await api('/api/orders/'+id+'/pay',{method:'POST'});loadAll()}
async function setOrderStatus(id,status){await api('/api/orders/'+id+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});loadAll()}
async function addExpense(){await api('/api/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:expTitle.value,amount:Number(expAmount.value),createdBy:user.username})});expTitle.value='';expAmount.value='';loadAll()}
allowed();loadAll();
if(user.role==='cashier')show('pos'); else if(user.role==='captain')show('orders'); else if(user.role==='kitchen')show('kitchen'); else show('dashboard');
</script>`));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const found = users.find(u => u.username === username && u.password === password && u.active);
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
  const total = (req.body.items || []).reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
  const order = {
    id: nextId(orders),
    type: req.body.type || 'Table',
    table: req.body.table || '',
    items: req.body.items || [],
    total,
    status: req.body.status || 'pending',
    paymentStatus: req.body.paymentStatus || 'unpaid',
    createdBy: req.body.createdBy || 'system',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  const t = tables.find(x => String(x.number) === String(order.table));
  if (t) t.status = 'busy';
  res.json(order);
});

app.post('/api/orders/:id/pay', (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'not found' });
  order.paymentStatus = 'paid';
  order.status = 'closed';
  const t = tables.find(x => String(x.number) === String(order.table));
  if (t) t.status = 'free';
  res.json(order);
});

app.post('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'not found' });
  order.status = req.body.status;
  res.json(order);
});

app.post('/api/expenses', (req, res) => {
  const expense = { id: nextId(expenses), title: req.body.title, amount: Number(req.body.amount || 0), createdBy: req.body.createdBy || 'system', createdAt: new Date().toISOString() };
  expenses.push(expense);
  res.json(expense);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cafe POS Pro full UI running on port ${PORT}`);
});
