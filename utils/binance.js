// utils/binance.js
import crypto from 'crypto';

export async function getBinanceRentability(apiKey, secretKey) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', secretKey).update(query).digest('hex');

  const res = await fetch(`https://fapi.binance.com/fapi/v2/account?${query}&signature=${signature}`, {
    headers: { 'X-MBX-APIKEY': apiKey },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Erro Binance');

  const totalWalletBalance = parseFloat(data.totalWalletBalance);
  const totalUnrealizedProfit = parseFloat(data.totalUnrealizedProfit);

  return {
    walletBalance: totalWalletBalance,
    unrealizedProfit: totalUnrealizedProfit,
  };
}

export async function getFuturesProfit() {
  try {
    const apiKey = process.env.API_KEY;
    const secretKey = process.env.API_SECRET;
    if (!apiKey || !secretKey) {
      throw new Error('Missing Binance API credentials');
    }
    const { walletBalance, unrealizedProfit } = await getBinanceRentability(apiKey, secretKey);
    if (walletBalance === 0) return 0;
    const profitPercentage = (unrealizedProfit / walletBalance); // e.g., 0.003 for 0.3%
    return profitPercentage;
  } catch (error) {
    console.error('Error fetching futures profit:', error);
    return 0; // Fallback to avoid API failure
  }
}