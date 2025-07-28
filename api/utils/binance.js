import pkg from 'binance-futures-connector';
const { USDMClient } = pkg;

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

    console.log('🟡 [LOG-CONNECTOR] -------------------------------');
    console.log(`🟡 [LOG-CONNECTOR] Puxando Realized PnL do dia`);
    console.log(`🕒 Início UTC: ${new Date(startTime).toISOString()}`);
    console.log(`🕒 Fim UTC:    ${new Date(endTime).toISOString()}`);
    console.log('🟡 [LOG-CONNECTOR] -------------------------------');

    const incomeList = await client.getIncomeHistory({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime,
      limit: 1000,
    });

    console.log(`🟡 [LOG-INCOME] Registros encontrados: ${incomeList.length}`);

    let totalRealized = 0;
    for (const item of incomeList) {
      const income = parseFloat(item.income || 0);
      const date = new Date(item.time).toISOString();
      console.log(`🔍 [ENTRY] ${item.symbol} | income: ${income} | time: ${date}`);
      totalRealized += income;
    }

    const account = await client.getBalance();
    const walletInfo = account.find((a) => a.asset === 'USDT');
    const walletBalance = parseFloat(walletInfo?.balance || 0);

    console.log(`🟢 [BALANCE] Saldo total USDT-M: ${walletBalance.toFixed(2)} USDT`);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;

    console.log(`💹 [RESULTADO FINAL] Realized PnL: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);
    console.log('✅ [FIM] -----------------------------------------');

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ [ERRO-GERAL] Falha ao buscar dados da Binance:', error.message);
    if (error.response?.data) {
      console.error('❌ [ERRO-DETALHADO]:', error.response.data);
    } else if (error.stack) {
      console.error('❌ [STACK]:', error.stack);
    }
    return 0;
  }
}
