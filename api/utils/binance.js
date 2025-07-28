import axios from 'axios';
import crypto from 'crypto';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

export async function getFuturesProfitPercentage() {
  try {
    const baseUrl = 'https://fapi.binance.com';
    const endpoint = '/fapi/v1/income';

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();

    const params = `incomeType=REALIZED_PNL&startTime=${startTime}&timestamp=${Date.now()}`;
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(params)
      .digest('hex');

    const url = `${baseUrl}${endpoint}?${params}&signature=${signature}`;

    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });

    const incomeList = response.data;

    const totalRealized = incomeList.reduce((acc, item) => {
      return acc + parseFloat(item.income || 0);
    }, 0);

    // Buscar saldo de futuros
    const accountInfo = await axios.get(`${baseUrl}/fapi/v2/account?timestamp=${Date.now()}&signature=${
      crypto.createHmac('sha256', API_SECRET).update(`timestamp=${Date.now()}`).digest('hex')
    }`, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });

    const totalWalletBalance = parseFloat(accountInfo.data.totalWalletBalance || 0);

    const profitPercentage =
      totalWalletBalance > 0 ? (totalRealized / totalWalletBalance) * 100 : 0;

    console.log(`💹 Realized PnL de hoje: $${totalRealized.toFixed(2)} (${profitPercentage.toFixed(4)}%)`);

    if (profitPercentage <= 0) return 0;
    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('❌ Erro ao buscar Realized PnL:', error.message);
    return 0;
  }
}
