import Binance from 'node-binance-api';

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_SECRET_KEY,
  useServerTime: true,
  recvWindow: 60000,
});

export async function getFuturesProfitPercentage() {
  try {
    const account = await binance.futuresAccount();
    const totalWalletBalance = parseFloat(account.totalWalletBalance || 0);
    const totalUnrealizedProfit = parseFloat(account.totalUnrealizedProfit || 0);

    const profitPercentage = totalWalletBalance > 0
      ? (totalUnrealizedProfit / totalWalletBalance) * 100
      : 0;

    console.log(`💹 Rentabilidade real bruta da Binance: ${profitPercentage.toFixed(4)}%`);

    // Só retorna valor positivo para o app, mas loga sempre
    if (profitPercentage <= 0) return 0;

    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('❌ Erro ao buscar dados da Binance:', error.message);
    return 0;
  }
}
