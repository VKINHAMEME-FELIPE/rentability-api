import express from 'express';
import { createPool } from '@vercel/postgres';
import { getFuturesProfitPercentage } from '../../utils/binance.js';

const router = express.Router();
const pool = createPool({ connectionString: process.env.DATABASE_URL });

router.get('/', async (req, res) => {
  const { unique_code } = req.query;

  if (!unique_code) {
    return res.status(400).json({ error: 'Código não informado' });
  }

  try {
    const { rows } = await pool.sql`SELECT vkinha_hold FROM users WHERE unique_code = ${unique_code}`;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    let profitPercentage = await getFuturesProfitPercentage();
    profitPercentage = Math.max(profitPercentage, 0.001); // mínimo 0.1%
    profitPercentage = Math.min(profitPercentage, 0.01);  // máximo 1%

    const isHolder = parseFloat(rows[0].vkinha_hold || 0) >= 175;

    return res.status(200).json({
      taxa: parseFloat(profitPercentage.toFixed(4)),
      holder: isHolder,
    });
  } catch (err) {
    console.error('Error fetching rate:', err.message);
    const { rows } = await pool.sql`SELECT vkinha_hold FROM users WHERE unique_code = ${unique_code}`;
    const isHolder = parseFloat(rows[0]?.vkinha_hold || 0) >= 175;
    return res.status(200).json({ taxa: isHolder ? 0.0012 : 0.0015, holder: isHolder });
  }
});

export default router;