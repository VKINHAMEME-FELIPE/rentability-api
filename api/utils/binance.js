import Binance from 'node-binance-api';

const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
  useServerTime: true,
  recvWindow: 60000,
});

export async function getFuturesProfitPercentage() {
  try {
    const account = await binance.futuresAccount();
    const totalWalletBalance = parseFloat(account.totalWalletBalance || 0);
    const totalUnrealizedProfit = parseFloat(account.totalUnrealizedProfit || 0);

    let profitPercentage = totalWalletBalance > 0
      ? (totalUnrealizedProfit / totalWalletBalance) * 100
      : 0;

    // Limites de 0.1% a 1%
    profitPercentage = Math.max(profitPercentage, 0.001);
    profitPercentage = Math.min(profitPercentage, 0.01);

    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('Erro ao buscar dados da Binance:', error.message);
    return 0.0015; // Fallback
  }
}