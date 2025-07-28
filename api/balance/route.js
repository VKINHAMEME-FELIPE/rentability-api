import express from 'express';
import { createPool } from '@vercel/postgres';
import { getTierPercentage, getTierTypeFromCode } from '../utils/tier.js';
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

    // Buscar tiers da conta via unique_code
    const { rows: tierRows } = await pool.sql`
      SELECT * FROM user_tiers WHERE unique_code = ${unique_code}
    `;

    if (tierRows.length === 0) {
      return res.status(200).json({
        wallet: user.wallet_address,
        tier: null,
        invested: 0,
        fgc: 0,
        saldo: 0,
        rentabilidade_total: 0,
        rentabilidade_disponivel: 0,
        rentabilidade_hoje: 0,
        total_sacado: 0,
      });
    }

    const tierData = tierRows[0]; // pegar o primeiro Tier
    const tierType = getTierTypeFromCode(tierData.tier_code); // ex: 'I', 'II', ...

    // Calcular rentabilidade do dia
    const rate = await getFuturesProfitPercentage(); // ex: 0.006
    const percentual = getTierPercentage(tierType); // ex: 0.60

    const saldo = parseFloat(tierData.saldo || 0);
    const rendimentoHoje = (saldo * rate * percentual).toFixed(4);

    return res.status(200).json({
      wallet: user.wallet_address,
      tier: tierType,
      invested: parseFloat(tierData.invested_amount || 0),
      fgc: parseFloat(tierData.fgc_amount || 0),
      saldo,
      rentabilidade_total: parseFloat(tierData.rentability_total || 0),
      rentabilidade_disponivel: parseFloat(tierData.rentability_available || 0),
      rentabilidade_hoje: parseFloat(rendimentoHoje),
      total_sacado: parseFloat(tierData.total_withdrawn || 0),
    });
  } catch (e) {
    console.error('Erro em /api/balance:', e.message);
    return res.status(500).json({ error: 'Erro ao buscar saldo', details: e.message });
  }
});

export default router;
