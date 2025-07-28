import ccxt from 'ccxt';

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET_KEY,
  enableRateLimit: true,
});

export async function getFuturesProfitPercentage() {
  try {
    const now = Date.now();
    const startDate = new Date('2025-07-25T00:00:00Z');
    const startTime = startDate.getTime();
    const endTime = now;

    console.log(`==> \n==> ///////////////////////////////////////////////////////////`);
    console.log(`🕒 [START TIME] ${startDate.toISOString()} (${startTime})`);
    console.log(`🕒 [END TIME] ${new Date(endTime).toISOString()} (${endTime})`);
    console.log(`⚙️ [FUTURES] Buscando REALIZED_PNL acumulado...`);
    console.log(`🔗 [FUTURES URL] https://fapi.binance.com/fapi/v1/income?incomeType=REALIZED_PNL&startTime=${startTime}&endTime=${endTime}`);

    const incomeList = await binance.fapiPrivateGetIncome({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime,
      limit: 1000,
    });

    console.log(`📊 [FUTURES] Itens recebidos: ${incomeList.length}`);
    incomeList.slice(0, 5).forEach((item, i) => {
      const timeStr = item.time ? new Date(item.time).toISOString() : 'Invalid date';
      console.log(`🔍 [ITEM ${i + 1}] symbol=${item.symbol}, income=${item.income}, time=${timeStr}`);
    });

    const totalRealized = incomeList.reduce((acc, item) => {
      const income = parseFloat(item.income || 0);
      return acc + income;
    }, 0);

    const balance = await binance.fetchBalance({ type: 'future' });
    const totalUSDT = parseFloat(balance.total.USDT || 0);
    const totalUSDC = parseFloat(balance.total.USDC || 0);
    const totalWalletBalance = totalUSDT + totalUSDC;

    console.log(`💼 [FUTURES BALANCE] USDT=${totalUSDT.toFixed(2)} | USDC=${totalUSDC.toFixed(2)} | Total=${totalWalletBalance.toFixed(2)}`);

    const profitPercentage = totalWalletBalance > 0
      ? (totalRealized / totalWalletBalance) * 100
      : 0;

    console.log(`💹 [RESULTADO FINAL] Realized PnL: $${totalRealized.toFixed(2)} | Percentual: ${profitPercentage.toFixed(4)}%`);

    return profitPercentage > 0 ? parseFloat(profitPercentage.toFixed(4)) : 0;
  } catch (error) {
    console.error(`⚠️ [FUTURES FALLBACK] Erro ao puxar PnL: ${error.message}`);
    console.log(`⚙️ [SPOT] Tentando buscar rentabilidade da conta SPOT como fallback...`);

    try {
      const spotBalance = await binance.fetchBalance();
      const totalUSDT = parseFloat(spotBalance.total.USDT || 0);
      const totalUSDC = parseFloat(spotBalance.total.USDC || 0);
      const freeUSDT = parseFloat(spotBalance.free.USDT || 0);
      const freeUSDC = parseFloat(spotBalance.free.USDC || 0);

      const totalSpot = totalUSDT + totalUSDC;
      const freeSpot = freeUSDT + freeUSDC;

      const variation = totalSpot > 0 ? ((totalSpot - freeSpot) / totalSpot) * 100 : 0;

      console.log(`📊 [SPOT] Total: ${totalSpot.toFixed(2)} | Livre: ${freeSpot.toFixed(2)} | Variação: ${variation.toFixed(4)}%`);
      return variation > 0 ? parseFloat(variation.toFixed(4)) : 0;
    } catch (spotError) {
      console.error(`❌ [SPOT FALLBACK] Erro: ${spotError.message}`);
      return 0;
    }
  }
}
