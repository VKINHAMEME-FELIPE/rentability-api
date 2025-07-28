import axios from 'axios';
import crypto from 'crypto';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

export async function getFuturesProfitPercentage() {
  try {
    const baseUrl = 'https://fapi.binance.com'; // USDT-M Futures
    const endpoint = '/fapi/v1/income';

    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();

    const query = `incomeType=REALIZED_PNL&startTime=${startTime}&timestamp=${now}`;
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(query)
      .digest('hex');

    const url = `${baseUrl}${endpoint}?${query}&signature=${signature}`;

    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });

    const incomeList = response.data || [];

    const totalRealized = incomeList.reduce((acc, item) => {
      return acc + parseFloat(item.income || 0);
    }, 0);

    // Buscar saldo da carteira de futuros
    const accQuery = `timestamp=${now}`;
    const accSignature = crypto
      .createHmac('sha256', API_SECRET)
      .update(accQuery)
      .digest('hex');

    const accUrl = `${baseUrl}/fapi/v2/account?${accQuery}&signature=${accSignature}`;

    const accResponse = await axios.get(accUrl, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });

    const walletBalance = parseFloat(accResponse.data.totalWalletBalance || 0);
    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;

    console.log(`💹 Realized PnL de hoje: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    // Para o FRONT-END só retorna se for positivo
    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ Erro ao buscar Realized PnL:', error.message);
    return 0;
  }
}
