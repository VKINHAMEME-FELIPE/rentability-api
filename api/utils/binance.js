import { Futures } from '@binance/connector';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

const client = new Futures(API_KEY, API_SECRET);

export async function getFuturesProfitPercentage() {
  try {
    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + 86400000;

    console.log(`🟡 [BINANCE] Fetching Realized PnL from ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`);

    const incomeResponse = await client.getIncomeHistory({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime,
      limit: 1000
    });

    const incomeList = incomeResponse.data || [];
    console.log(`🟡 [INCOME] Registros encontrados: ${incomeList.length}`);

    let totalRealized = 0;
    for (const item of incomeList) {
      const income = parseFloat(item.income || 0);
      const time = new Date(item.time).toISOString();
      console.log(`🔍 [ENTRY] ${item.symbol} | income: ${income} | time: ${time}`);
      totalRealized += income;
    }

    const balanceRes = await client.getBalance();
    const wallet = balanceRes.data.find(item => item.asset === 'USDT');
    const walletBalance = parseFloat(wallet?.balance || 0);

    console.log(`🟢 [BALANCE] Saldo total USDT: ${walletBalance}`);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;
    console.log(`💹 [RESULTADO FINAL] Realized PnL: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ [ERRO GERAL]', error.message);
    if (error.response?.data) console.error('❌ [ERRO API]:', error.response.data);
    return 0;
  }
}
