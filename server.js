const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>Cafe POS Pro</h1>
    <h2>Login System Ready</h2>
    <p>Frontend deployment successful</p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running');
});
