{
  "name": "cafe-pos-pro",
  "version": "2.1.0",
  "description": "Cafe POS with users, roles, products, tables, orders, expenses and kitchen screen",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "init-db": "node init-db.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "connect-pg-simple": "^9.0.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "helmet": "^7.1.0",
    "pg": "^8.12.0",
    "socket.io": "^4.7.5"
  },
  "engines": {
    "node": ">=18"
  }
}
