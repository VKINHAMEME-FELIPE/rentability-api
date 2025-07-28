import ccxt from 'ccxt';

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  enableRateLimit: true,
});

export async function getFuturesProfitPercentage() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime() - 3600000; // Subtrai 1 hora para capturar transações
    console.log(`🕒 Start time for futuresIncome: ${today.toISOString()} (${startTime})`);

    // Configurar para futuros em USDC
    await binance.setMarginMode('cross', 'USDC');

    // Buscar histórico de lucros (REALIZED_PNL)
    const incomeList = await binance.fetchIncome({
      symbol: null, // Todos os símbolos
      since: startTime,
      limit: 1000,
      params: { incomeType: 'REALIZED_PNL' },
    });

    console.log(`📊 Income list length: ${incomeList.length}`);
    console.log(`📊 Income list sample: ${JSON.stringify(incomeList.slice(0, 2), null, 2)}`);

    const totalRealized = incomeList.reduce((acc, item) => {
      const income = parseFloat(item.amount || item.income || 0);
      console.log(`📈 Income item: ${JSON.stringify(item)}, Parsed income: ${income}`);
      return acc + income;
    }, 0);

    // Buscar saldo da conta de futuros
    const account = await binance.fetchBalance({ type: 'future', marginMode: 'cross' });
    console.log(`📊 Full account response: ${JSON.stringify(account, null, 2)}`);

    const totalWalletBalance = parseFloat(account.USDC?.total || 0);
    console.log(`💰 USDC wallet balance: $${totalWalletBalance.toFixed(2)}`);

    const profitPercentage =
      totalWalletBalance > 0 ? (totalRealized / totalWalletBalance) * 100 : 0;

    console.log(`💹 Realized PnL de hoje: $${totalRealized.toFixed(2)} (${profitPercentage.toFixed(4)}%)`);

    if (profitPercentage <= 0) return 0;
    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('❌ Erro ao buscar Realized PnL:', error.message);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return 0;
  }
}