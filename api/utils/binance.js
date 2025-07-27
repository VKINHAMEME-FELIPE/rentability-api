
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

    const profitPercentage = totalWalletBalance > 0
      ? (totalUnrealizedProfit / totalWalletBalance) * 100
      : 0;

    console.log(`💹 Rentabilidade bruta Binance: ${profitPercentage.toFixed(4)}%`);
    return parseFloat(profitPercentage.toFixed(4));
  } catch (error) {
    console.error('❌ Erro ao buscar dados da Binance:', error.message);
    return 0.15; // fallback em porcentagem
  }
}
