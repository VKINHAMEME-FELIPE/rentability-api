import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';
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
    return NextResponse.json({ error: 'Código não informado' }, { status: 400 });
  }

  try {
    const { rows } = await pool.sql`SELECT vkinha_hold FROM users WHERE unique_code = ${unique_code}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const account = await binance.futuresAccount();
    const totalWalletBalance = parseFloat(account.totalWalletBalance || 0);
    const totalUnrealizedProfit = parseFloat(account.totalUnrealizedProfit || 0);
    let profitPercentage = totalWalletBalance > 0 ? totalUnrealizedProfit / totalWalletBalance : 0;
    profitPercentage = Math.max(profitPercentage, 0.001); // Mínimo 0.1%
    profitPercentage = Math.min(profitPercentage, 0.01); // Máximo 1%

    const isHolder = parseFloat(rows[0].vkinha_hold || 0) >= 175;

    return NextResponse.json({ taxa: parseFloat(profitPercentage.toFixed(4)), holder: isHolder }, { status: 200 });
  } catch (err) {
    console.error('Error fetching rate:', err.message);
    const { rows } = await pool.sql`SELECT vkinha_hold FROM users WHERE unique_code = ${unique_code}`;
    const isHolder = parseFloat(rows[0]?.vkinha_hold || 0) >= 175;
    return NextResponse.json({ taxa: isHolder ? 0.0012 : 0.0015, holder: isHolder }, { status: 200 });
  }
}