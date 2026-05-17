const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// بيانات تجريبية
let products = [
  { id: 1, name: 'Coffee', price: 3 },
  { id: 2, name: 'Tea', price: 2 },
  { id: 3, name: 'Mojito', price: 5 }
];

let orders = [];
let expenses = [];
let users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'cashier', password: 'cashier123', role: 'cashier' },
  { username: 'captain', password: 'captain123', role: 'captain' },
  { username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
];

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Cafe POS Pro</title>
        <style>
          body {
            font-family: Arial;
            background: #111;
            color: white;
            padding: 40px;
          }
          .card {
            background: #1f1f1f;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
          }
          button {
            padding: 10px 20px;
            border: none;
            background: #0ea5e9;
            color: white;
            border-radius: 6px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>Cafe POS Pro</h1>

        <div class="card">
          <h2>Products</h2>
          <ul>
            ${products.map(p => `<li>${p.name} - $${p.price}</li>`).join('')}
          </ul>
        </div>

        <div class="card">
          <h2>Users</h2>
          <ul>
            ${users.map(u => `<li>${u.username} (${u.role})</li>`).join('')}
          </ul>
        </div>

        <div class="card">
          <h2>Orders</h2>
          <div id="orders"></div>
          <button onclick="createOrder()">Create Test Order</button>
        </div>

        <script>
          async function loadOrders() {
            const res = await fetch('/api/orders');
            const data = await res.json();

            document.getElementById('orders').innerHTML = data.map(o =>
              '<p>Table ' + o.table + ' - ' + o.status + ' - $' + o.total + '</p>'
            ).join('');
          }

          async function createOrder() {
            await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                table: Math.floor(Math.random() * 10) + 1,
                total: 15
              })
            });

            loadOrders();
          }

          loadOrders();
        </script>
      </body>
    </html>
  `);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: orders.length + 1,
    table: req.body.table,
    total: req.body.total,
    status: 'Pending Payment'
  };

  orders.push(order);

  io.emit('new-order', order);

  res.json(order);
});

app.get('/api/expenses', (req, res) => {
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const expense = {
    id: expenses.length + 1,
    title: req.body.title,
    amount: req.body.amount
  };

  expenses.push(expense);

  res.json(expense);
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Cafe POS Pro running on port ${PORT}`);
});
