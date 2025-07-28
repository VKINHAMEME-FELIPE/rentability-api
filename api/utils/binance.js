import Binance from 'node-binance-api';

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_SECRET_KEY,
  useServerTime: true,
  recvWindow: 60000,
});

export async function getFuturesProfitPercentage() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // início do dia UTC
    const startTime = today.getTime() - 3600000; // Subtract 1 hour to capture edge cases
    console.log(`🕒 Start time for futuresIncome: ${today.toISOString()} (${startTime})`);

    // Fetch income data for USDC-margined futures
    const incomeList = await binance.futuresIncome({
      incomeType: 'REALIZED_PNL',
      startTime: startTime,
      limit: 1000,
      // Note: node-binance-api may not have a direct USDC parameter; we rely on correct account context
    });

    console.log(`📊 Income list length: ${incomeList.length}`);
    console.log(`📊 Income list sample: ${JSON.stringify(incomeList.slice(0, 2), null, 2)}`);

    const totalRealized = incomeList.reduce((acc, item) => {
      const income = parseFloat(item.income) || 0;
      console.log(`📈 Income item: ${JSON.stringify(item)}, Parsed income: ${income}`);
      return acc + income;
    }, 0);

    // Fetch account data for USDC-margined futures
    const account = await binance.futuresAccount();
    console.log(`📊 Full account response: ${JSON.stringify(account, null, 2)}`);

    // Check for USDC balance explicitly
    let totalWalletBalance = 0;
    if (account.assets) {
      const usdcAsset = account.assets.find(asset => asset.asset === 'USDC');
      totalWalletBalance = parseFloat(usdcAsset?.walletBalance || 0);
      console.log(`💰 USDC wallet balance: $${totalWalletBalance.toFixed(2)}`);
    } else {
      totalWalletBalance = parseFloat(account.totalWalletBalance || 0);
      console.log(`💰 Total wallet balance (fallback): $${totalWalletBalance.toFixed(2)}`);
    }

    const profitPercentage =
      totalWalletBalance > 0 ? (totalRealized / totalWalletBalance) * 100 : 0;

    // Log the actual values, including negatives
    console.log(`💹 Realized PnL de hoje: $${totalRealized.toFixed(2)} (${profitPercentage.toFixed(4)}%)`);

    // Return 0 for non-positive values for API consistency
    if (profitPercentage <= 0) return 0;

    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('❌ Erro ao buscar Realized PnL:', error.message);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return 0;
  }
}