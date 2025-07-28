import binance from '@binance/connector';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

const client = binance.futures({
  apiKey: API_KEY,
  apiSecret: API_SECRET
});

export async function getFuturesProfitPercentage() {
  try {
    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + 86400000;

    console.log(`🟡 [BINANCE] Período: ${new Date(startTime).toISOString()} → ${new Date(endTime).toISOString()}`);

    const incomeResponse = await client.getIncomeHistory({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime,
      limit: 1000
    });

    const incomeList = incomeResponse.data || [];
    console.log(`🟡 [INCOME] Entradas: ${incomeList.length}`);

    let totalRealized = 0;
    for (const item of incomeList) {
      const income = parseFloat(item.income || 0);
      console.log(`🔍 ${item.symbol} | income: ${income} | ${new Date(item.time).toISOString()}`);
      totalRealized += income;
    }

    const balanceRes = await client.getBalance();
    const wallet = balanceRes.data.find(item => item.asset === 'USDT');
    const walletBalance = parseFloat(wallet?.balance || 0);

    console.log(`🟢 [BALANCE] Wallet USDT: ${walletBalance}`);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;
    console.log(`💹 Resultado: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response?.data) {
      console.error('❌ Detalhes API:', error.response.data);
    }
    return 0;
  }
}
