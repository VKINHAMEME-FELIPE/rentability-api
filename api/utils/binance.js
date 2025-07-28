import axios from 'axios';
import crypto from 'crypto';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

export async function getFuturesProfitPercentage() {
  try {
    const baseUrl = 'https://fapi.binance.com';

    // Preparar datas de início e fim do dia
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + 86400000;

    // Timestamp exclusivo para a chamada income
    const incomeTimestamp = Date.now();
    const incomeQuery = `incomeType=REALIZED_PNL&startTime=${startTime}&endTime=${endTime}&timestamp=${incomeTimestamp}`;
    const incomeSignature = crypto.createHmac('sha256', API_SECRET).update(incomeQuery).digest('hex');
    const incomeUrl = `${baseUrl}/fapi/v1/income?${incomeQuery}&signature=${incomeSignature}`;

    console.log('🟡 [LOG-INCOME] URL chamada:', incomeUrl);

    const incomeResponse = await axios.get(incomeUrl, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });

    const incomeList = incomeResponse.data || [];

    console.log(`🟡 [LOG-INCOME] Itens recebidos (${incomeList.length}):`, incomeList);

    const totalRealized = incomeList.reduce((acc, item) => {
      const income = parseFloat(item.income || 0);
      console.log(`🔍 [LOG-INCOME-ENTRY] symbol=${item.symbol}, income=${income}, time=${new Date(item.time).toISOString()}`);
      return acc + income;
    }, 0);

    // Timestamp exclusivo para chamada de saldo
    const accTimestamp = Date.now();
    const accQuery = `timestamp=${accTimestamp}`;
    const accSignature = crypto.createHmac('sha256', API_SECRET).update(accQuery).digest('hex');
    const accUrl = `${baseUrl}/fapi/v2/account?${accQuery}&signature=${accSignature}`;

    console.log('🟡 [LOG-ACCOUNT] URL chamada:', accUrl);

    const accResponse = await axios.get(accUrl, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });

    const walletBalance = parseFloat(accResponse.data.totalWalletBalance || 0);

    console.log(`🟢 [LOG-ACCOUNT] Saldo total USDT-M futures: ${walletBalance}`);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;

    console.log(`💹 [RESULTADO FINAL] Realized PnL de hoje: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ [ERRO FINAL] ao buscar Realized PnL:', error.message);
    if (error.response) {
      console.error('❌ [ERRO RESPONSE DATA]:', error.response.data);
    }
    return 0;
  }
}