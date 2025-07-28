import ccxt from 'ccxt';

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  enableRateLimit: true,
});

export async function getFuturesProfitPercentage() {
  try {
    const startDate = new Date(Date.UTC(2025, 6, 25)); // 25/07/2025
    startDate.setUTCHours(0, 0, 0, 0);
    const startTime = startDate.getTime();

    const now = new Date();
    const endTime = now.getTime();

    console.log(`🕒 [START TIME] ${startDate.toISOString()} (${startTime})`);
    console.log(`🕒 [END TIME] ${now.toISOString()} (${endTime})`);

    let totalRealized = 0;

    try {
      console.log(`⚙️ [FUTURES] Buscando REALIZED_PNL acumulado...`);
      const income = await binance.fapiPrivateGetIncome({
        incomeType: 'REALIZED_PNL',
        startTime,
        endTime,
        limit: 1000,
      });

      console.log(`📊 [FUTURES] Itens recebidos: ${income.length}`);
      for (const item of income) {
        const incomeValue = parseFloat(item.income || 0);
        console.log(`📈 [INCOME] ${item.symbol} | income: ${incomeValue} | time: ${new Date(item.time).toISOString()}`);
        totalRealized += incomeValue;
      }
    } catch (futuresError) {
      console.warn('⚠️ [FUTURES FALLBACK] Erro ao puxar PnL:', futuresError.message);
      return 0;
    }

    const wallet = await binance.fetchBalance({ type: 'future' }).catch(() => null);
    const balance = parseFloat(wallet?.total?.USDT || 0);

    console.log(`💰 [WALLET] Total USDT-M: ${balance}`);

    const percent = balance > 0 ? (totalRealized / balance) * 100 : 0;
    console.log(`💹 [RESULTADO FINAL] Realized PnL acumulado: $${totalRealized.toFixed(2)} | Percentual: ${percent.toFixed(4)}%`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (err) {
    console.error('❌ [ERRO GERAL]', err.message);
    console.error('❌ [DETAILS]', JSON.stringify(err, null, 2));
    return 0;
  }
}
