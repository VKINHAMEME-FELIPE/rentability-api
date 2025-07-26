import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getTierPercentage, getTierTypeFromCode } from '@/utils/tier';
import Binance from 'node-binance-api';

const pool = createPool({ connectionString: process.env.DATABASE_URL });
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET,
  useServerTime: true,
  recvWindow: 60000,
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const unique_code = searchParams.get('unique_code');

  if (!unique_code) {
    return NextResponse.json({ error: 'Código único não informado' }, { status: 400 });
  }

  try {
    const { rows: userRows } = await pool.sql`SELECT wallet_address, vkinha_hold, email, cpf, phone FROM users WHERE unique_code = ${unique_code}`;
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { rows: tierRows } = await pool.sql`SELECT * FROM user_tiers WHERE unique_code = ${unique_code}`;
    if (tierRows.length === 0) {
      return NextResponse.json({ error: 'Nenhum tier encontrado para o usuário' }, { status: 404 });
    }

    let binancePnL = 0;
    try {
      const account = await binance.futuresAccount();
      const totalWalletBalance = parseFloat(account.totalWalletBalance || 0);
      const totalUnrealizedProfit = parseFloat(account.totalUnrealizedProfit || 0);
      binancePnL = totalWalletBalance > 0 ? totalUnrealizedProfit / totalWalletBalance : 0;
      binancePnL = Math.max(binancePnL, 0.001); // Mínimo 0.1%
      binancePnL = Math.min(binancePnL, 0.01); // Máximo 1%
    } catch (err) {
      console.error('Binance API error:', err.message);
    }

    const isHolder = parseFloat(userRows[0].vkinha_hold || 0) >= 175;

    let totalInvested = 0;
    let totalSaldoQueRende = 0;
    let totalFgc = 0;
    let totalSaldo = 0;
    let totalRentabilityHoje = 0;
    let totalRentabilityTotal = 0;
    let totalRentabilityAvailable = 0;
    let totalWithdrawn = 0;
    let highestTierPercent = 0;

    for (const tier of tierRows) {
      const tierType = getTierTypeFromCode(tier.tier_code);
      const tierPercent = getTierPercentage(tierType);
      const invested = parseFloat(tier.invested_amount || 0);
      const saldoQueRende = invested * 0.8;
      const fgc = parseFloat(tier.fgc_amount || invested * 0.2);
      const saldo = parseFloat(tier.saldo || 0);
      const rentabilityHoje = saldoQueRende * binancePnL * tierPercent;

      totalInvested += invested;
      totalSaldoQueRende += saldoQueRende;
      totalFgc += fgc;
      totalSaldo += saldo;
      totalRentabilityHoje += rentabilityHoje;
      totalRentabilityTotal += parseFloat(tier.rentability_total || 0);
      totalRentabilityAvailable += parseFloat(tier.rentability_available || 0);
      totalWithdrawn += parseFloat(tier.total_withdrawn || 0);
      highestTierPercent = Math.max(highestTierPercent, tierPercent);
    }

    return NextResponse.json({
      wallet: userRows[0].wallet_address || null,
      email: userRows[0].email || null,
      cpf: userRows[0].cpf || null,
      phone: userRows[0].phone || null,
      tier: tierRows.map(t => t.tier_code).join(', ') || 'I',
      invested: totalInvested,
      saldo_que_rende: totalSaldoQueRende,
      fgc: totalFgc,
      saldo: totalSaldo,
      rentability_total: totalRentabilityTotal,
      rentability_available: totalRentabilityAvailable,
      rentability_hoje: totalRentabilityHoje,
      rentability_percentual: binancePnL * highestTierPercent,
      lucro_binance_percentual: binancePnL,
      tier_percentual: highestTierPercent,
      total_sacado: totalWithdrawn,
      holder: isHolder,
    }, { status: 200 });
  } catch (e) {
    console.error('Error fetching balance:', e.message);
    return NextResponse.json({ error: 'Erro ao buscar saldo', details: e.message }, { status: 500 });
  }
}