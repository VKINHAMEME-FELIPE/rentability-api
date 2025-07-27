import crypto from 'crypto';
import axios from 'axios';

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const API_URL = 'https://fapi.binance.com';

export async function getFuturesProfitPercentage() {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(queryString)
      .digest('hex');

    const response = await axios.get(`${API_URL}/fapi/v2/account?${queryString}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': API_KEY },
    });

    const { totalWalletBalance, totalUnrealizedProfit } = response.data;
    const profitPercentage = (parseFloat(totalUnrealizedProfit) / parseFloat(totalWalletBalance)) * 100;
    return profitPercentage;
  } catch (error) {
    console.error('Error fetching futures profit:', error.message);
    return 0; // Fallback to avoid API failure
  }
}