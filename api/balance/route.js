import express from 'express';
import { createPool } from '@vercel/postgres';
import { getTierPercentage } from '../utils/tier.js';
import { getFuturesProfitPercentage } from '../utils/binance.js';

const router = express.Router();
const pool = createPool({ connectionString: process.env.DATABASE_URL });

router.get('/', async (req, res) => {
  const unique_code = req.query.unique_code;

  if (!unique_code) {
    return res.status(400).json({ error: 'Código único não informado' });
  }

  try {
    // Buscar usuário
    const { rows: userRows } = await pool.sql`SELECT * FROM users WHERE unique_code = ${unique_code}`;
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const user = userRows[0];

    // Buscar dados do tier
    const { rows: tierRows } = await pool.sql`SELECT * FROM user_tiers WHERE unique_code = ${unique_code}`;
    if (tierRows.length === 0) {
      return res.status(404).json({ error: 'Nenhum tier encontrado para o usuário' });
    }

    // Calcular rentabilidade do dia (com fallback da Binance)
    const rate = await getFuturesProfitPercentage(); // ex: 0.0032
    const tierPercentage = getTierPercentage(user.tier); // ex: 0.60 (Tier I)

    const saldo = parseFloat(tierRows[0].saldo || 0);
    const rendimentoHoje = (saldo * rate * tierPercentage).toFixed(4);

    return res.status(200).json({
      wallet: user.wallet_address,
      tier: user.tier,
      invested: parseFloat(tierRows[0].invested_amount || 0),
      fgc: parseFloat(tierRows[0].fgc_amount || 0),
      saldo: saldo,
      rentabilidade_total: parseFloat(tierRows[0].rentability_total || 0),
      rentabilidade_disponivel: parseFloat(tierRows[0].rentability_available || 0),
      rentabilidade_hoje: parseFloat(rendimentoHoje),
      total_sacado: parseFloat(tierRows[0].total_withdrawn || 0),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao buscar saldo', details: e.message });
  }
});

export default router;
