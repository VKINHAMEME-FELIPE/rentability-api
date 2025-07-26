export function getTierPercentage(tier) {
  const tierMap = {
    'I': 0.60,
    'II': 0.67,
    'III': 0.74,
    'IV': 0.78,
    'V': 0.85,
    'VI': 0.90,
  };
  return tierMap[tier] || 0.60; // Fallback to Tier I
}

export function getTierTypeFromCode(tierCode) {
  if (!tierCode || typeof tierCode !== 'string') return 'I';
  const prefixToTier = {
    'A': 'I',
    'B': 'II',
    'C': 'III',
    'D': 'IV',
    'E': 'V',
    'F': 'VI',
  };
  return prefixToTier[tierCode[0]] || 'I';
}

export function generateTierCode(tierType) {
  const prefix = { 'I': 'A', 'II': 'B', 'III': 'C', 'IV': 'D', 'V': 'E', 'VI': 'F' }[tierType];
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${prefix}${random}`;
}

export function getTierTypeFromAmount(amount) {
  if (amount >= 1000) return 'V';
  if (amount >= 500) return 'IV';
  if (amount >= 250) return 'III';
  if (amount >= 100) return 'II';
  return 'I';
}