import pkg from 'binance-futures-connector';
const { default: BinanceFutures } = pkg;

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_SECRET_KEY;

const client = new BinanceFutures({
  api_key: API_KEY,
  api_secret: API_SECRET
});

export async function getFuturesProfitPercentage() {
  try {
    const now = Date.now();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    const endTime = startTime + 86400000;

    console.log(`🟡 [LOG-INCOME] Buscando Realized PnL entre: ${new Date(startTime).toISOString()} e ${new Date(endTime).toISOString()}`);

    const incomeResponse = await client.getIncomeHistory({
      incomeType: 'REALIZED_PNL',
      startTime,
      endTime
    });

    const incomeList = incomeResponse || [];
    console.log(`🟡 [LOG-INCOME] Itens recebidos: ${incomeList.length}`);

    let totalRealized = 0;
    for (const item of incomeList) {
      const income = parseFloat(item.income || 0);
      console.log(`🔍 PnL ${item.symbol} = ${income} em ${new Date(item.time).toISOString()}`);
      totalRealized += income;
    }

    const accountInfo = await client.getBalance();
    const usdtWallet = accountInfo?.find((item) => item.asset === 'USDT');
    const walletBalance = parseFloat(usdtWallet?.balance || 0);

    console.log(`🟢 [LOG-BALANCE] Wallet USDT: ${walletBalance}`);

    const percent = walletBalance > 0 ? (totalRealized / walletBalance) * 100 : 0;
    console.log(`💹 [RESULTADO FINAL] Realized PnL de hoje: $${totalRealized.toFixed(2)} (${percent.toFixed(4)}%)`);

    return percent > 0 ? parseFloat(percent.toFixed(4)) : 0;
  } catch (err) {
    console.error('❌ [ERRO GERAL]', err?.message);
    if (err?.response?.data) {
      console.error('❌ [ERRO RESPONSE]', err.response.data);
    }
    return 0;
  }
}
