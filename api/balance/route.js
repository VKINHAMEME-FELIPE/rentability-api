// api/balance/route.js
import express from 'express';
import { createPool } from '@vercel/postgres';
import { getTierPercentage } from '../../utils/tier.js';
import { getFuturesProfitPercentage } from '../../utils/binance.js';

const router = express.Router();
const pool = createPool({ connectionString: process.env.DATABASE_URL });

router.get('/', async (req, res) => {
  const unique_code = req.query.unique_code;

  if (!unique_code) {
    return res.status(400).json({ error: 'Código único não informado' });
  }

  try {
    const { rows } = await pool.sql`SELECT * FROM users WHERE unique_code = ${unique_code}`;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];
    const rate = await getFuturesProfitPercentage();
    const tierPercentage = getTierPercentage(user.tier);
    const rendimentoHoje = ((parseFloat(user.saldo) || 0) * rate * tierPercentage).toFixed(4);

    return res.status(200).json({
      wallet: user.wallet_address,
      tier: user.tier,
      invested: parseFloat(user.invested_amount),
      fgc: parseFloat(user.fgc_amount),
      saldo: parseFloat(user.saldo),
      rentabilidade_total: parseFloat(user.rentability_total),
      rentabilidade_disponivel: parseFloat(user.rentability_available),
      rentabilidade_hoje: parseFloat(rendimentoHoje),
      total_sacado: parseFloat(user.total_withdrawn),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao buscar saldo', details: e.message });
  }
});

export default router;
