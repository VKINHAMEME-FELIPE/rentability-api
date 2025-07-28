import { USDMClient } from 'binance-futures-connector';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

const client = new USDMClient({
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export async function getFuturesProfitPercentage() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + 86400000;

    console.log(`🟡 [LOG-CONNECTOR] Buscando Realized PnL de ${new Date(startTime).toISOString()} até ${new Date(endTime).toISOString()}`);

    const incomeList = await client.getIncomeHistory({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime,
      limit: 1000,
    });

    console.log(`🟡 [LOG-CONNECTOR] Itens recebidos (income): ${incomeList.length}`);

    let totalRealized = 0;
    for (const item of incomeList) {
      const income = parseFloat(item.income || 0);
      console.log(`🔍 [ENTRY] symbol=${item.symbol}, income=${income}, time=${new Date(item.time).toISOString()}`);
      totalRealized += income;
    }

    const account = await client.getBalance();
    const walletInfo = account.find((a) => a.asset === 'USDT');
    const walletBalance = parseFloat(walletInfo.balance || 0);

    console.log(`🟢 [LOG-CONNECTOR] Saldo total USDT-M: ${walletBalance}`);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;

    console.log(`💹 [RESULTADO FINAL] Realized PnL de hoje: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ [ERRO-CONNECTOR] ao buscar dados da Binance:', error.message);
    if (error.response?.data) {
      console.error('❌ [RESPONSE-DETAIL]:', error.response.data);
    }
    return 0;
  }
}