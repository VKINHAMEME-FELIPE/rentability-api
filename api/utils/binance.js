import ccxt from 'ccxt';

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  enableRateLimit: true,
});

export async function getFuturesProfitPercentage() {
  try {
    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    console.log(`🕒 [START TIME] ${today.toISOString()} (${startTime})`);

    let totalRealized = 0;

    try {
      console.log(`⚙️ Tentando puxar dados da conta FUTURES...`);
      const futuresIncome = await binance.fapiPrivateGetIncome({
        incomeType: 'REALIZED_PNL',
        startTime,
        limit: 1000,
      });

      console.log(`📊 [FUTURES] Items recebidos: ${futuresIncome.length}`);
      for (const item of futuresIncome) {
        const income = parseFloat(item.income || 0);
        console.log(`📈 [FUTURES] ${item.symbol} | income: ${income} | time: ${new Date(item.time).toISOString()}`);
        totalRealized += income;
      }
    } catch (futuresError) {
      console.warn('⚠️ [FALLBACK] Falha ao puxar FUTURES:', futuresError.message);
      console.warn('⚠️ [FALLBACK] Tentando saldo da CONTA SPOT como fallback...');

      const account = await binance.fetchBalance();
      const usdtBalance = parseFloat(account.total.USDT || 0);
      const spotProfit = usdtBalance * 0.01; // suposição fictícia, substitua se tiver lógica melhor
      totalRealized = spotProfit;
      console.log(`💼 [SPOT] USDT: ${usdtBalance} => lucro estimado: ${spotProfit}`);
    }

    const wallet = await binance.fetchBalance({ type: 'future' }).catch(() => null);
    const balance = parseFloat(wallet?.total?.USDT || 0);
    const percent = balance > 0 ? (totalRealized / balance) * 100 : 0;

    console.log(`💹 [RESULTADO FINAL] Realized PnL: $${totalRealized.toFixed(2)} | Percentual: ${percent.toFixed(4)}%`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (err) {
    console.error('❌ [ERRO GERAL]', err.message);
    console.error(JSON.stringify(err, null, 2));
    return 0;
  }
}
