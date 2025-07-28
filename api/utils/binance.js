import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getFuturesProfitPercentage } from '../../utils/binance.js';
import { getTierPercentage, getTierTypeFromCode } from '../../utils/tier.js';

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const unique_code = searchParams.get('unique_code');

  if (!unique_code) {
    return NextResponse.json({ error: 'Código único é obrigatório' }, { status: 400 });
  }

  try {
    const { rows } = await pool.sql`
      SELECT 
        invested_amount AS invested,
        fgc_amount AS fgc,
        saldo,
        rentability_total,
        rentability_available,
        total_withdrawn,
        tier_code
      FROM user_tiers 
      WHERE unique_code = ${unique_code}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userData = rows[0];
    const tierType = getTierTypeFromCode(userData.tier_code || 'I');
    const rate = await getFuturesProfitPercentage();
    const percentual = getTierPercentage(tierType);
    const saldo = parseFloat(userData.saldo || 0);
    const rendimentoHoje = (saldo * rate * percentual).toFixed(4);

    return NextResponse.json({
      saldo: userData.saldo || 0,
      rentability_hoje: parseFloat(rendimentoHoje) > 0 ? parseFloat(rendimentoHoje) : 0,
      rentability_total: userData.rentability_total || 0,
      rentability_available: userData.rentability_available || 0,
      total_sacado: userData.total_withdrawn || 0,
      invested: userData.invested || 0,
      fgc: userData.fgc || 0,
      saldo_que_rende: userData.saldo || 0,
    }, { status: 200 });
  } catch (e) {
    console.error('Error fetching balance:', e.message);
    return NextResponse.json({ error: 'Erro ao buscar saldo', details: e.message }, { status: 500 });
  }
}