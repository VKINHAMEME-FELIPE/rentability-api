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

    // Se não tem saldo ou o lucro é negativo/nulo, retorna 0
    if (totalWalletBalance <= 0 || totalUnrealizedProfit <= 0) {
      console.log(`💹 Rentabilidade bruta: 0% (sem lucro válido)`);
      return 0;
    }

    const profitPercentage = (totalUnrealizedProfit / totalWalletBalance) * 100;
    const formatted = parseFloat(profitPercentage.toFixed(4));

    // Só retorna se for de fato positivo
    if (formatted <= 0) {
      console.log(`💹 Rentabilidade bruta: 0% (filtrada por segurança)`);
      return 0;
    }

    console.log(`💹 Rentabilidade bruta Binance: ${formatted}%`);
    return formatted;
  } catch (error) {
    console.error('❌ Erro ao buscar dados da Binance:', error.message);
    return 0;
  }
}
