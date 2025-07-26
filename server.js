// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateRoute from './api/rate/today/route.js';
import balanceRoute from './api/balance/route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/rate/today', rateRoute);
app.use('/api/balance', balanceRoute);

// Healthcheck
app.get('/', (req, res) => {
  res.send('Rentability API is running ✅');
});

app.listen(PORT, () => {
  console.log(`🚀 Rentability API running on port ${PORT}`);
});
