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

    const incomeList = await binance.futuresIncome({
      incomeType: 'REALIZED_PNL',
      startTime: today.getTime(),
      limit: 1000,
    });

    const totalRealized = incomeList.reduce((acc, item) => acc + parseFloat(item.income), 0);

    // Obter o saldo atual da carteira para calcular a % baseada em capital real
    const account = await binance.futuresAccount();
    const totalWalletBalance = parseFloat(account.totalWalletBalance || 0);

    const profitPercentage =
      totalWalletBalance > 0 ? (totalRealized / totalWalletBalance) * 100 : 0;

    console.log(`💹 Realized PnL de hoje: $${totalRealized.toFixed(2)} (${profitPercentage.toFixed(4)}%)`);

    // Só retornar valor positivo para a API
    if (profitPercentage <= 0) return 0;

    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('❌ Erro ao buscar Realized PnL:', error.message);
    return 0;
  }
}
