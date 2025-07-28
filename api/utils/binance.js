// ✅ binance.js atualizado para puxar a rentabilidade real da Binance
// Suporte à conta de futuros USDT-M com fallback seguro e logs detalhados

import pkg from 'binance-futures-connector';
const { USDMClient } = pkg;

const client = new USDMClient({
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_SECRET_KEY
});

export async function getFuturesProfitPercentage() {
  try {
    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + 86400000;

    console.log(`🟡 [LOG-INCOME] Start: ${new Date(startTime).toISOString()} - End: ${new Date(endTime).toISOString()}`);

    const incomeList = await client.getIncomeHistory({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime
    });

    console.log(`🟡 [LOG-INCOME] Itens recebidos: ${incomeList.length}`);

    let totalRealized = 0;
    for (const item of incomeList) {
      const income = parseFloat(item.income || 0);
      console.log(`🔍 ${item.symbol} | income: ${income} | time: ${new Date(item.time).toISOString()}`);
      totalRealized += income;
    }

    const accountData = await client.getAccountInformation();
    const walletBalance = parseFloat(accountData.totalWalletBalance || 0);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;
    console.log(`💹 [RESULTADO FINAL] Realized PnL de hoje: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (error) {
    console.error('❌ [ERRO GERAL]', error?.response?.data || error.message || error);
    return 0;
  }
}
