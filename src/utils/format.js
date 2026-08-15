export const formatEuro = (amount, locale = 'fr-FR') => {
  if (amount === null || amount === undefined) return '0,00 €';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCrypto = (amount, symbol = '', locale = 'en-US') => {
  if (amount === null || amount === undefined) return `0 ${symbol}`;
  const num = parseFloat(amount) || 0;
  // Dynamic fraction digits based on the value to show small cryptos properly
  const decimals = num === 0 ? 2 : num < 1 ? 6 : 4;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(num) + (symbol ? ` ${symbol}` : '');
};

export const formatQuantity = (quantity, locale = 'en-US') => {
  if (quantity === null || quantity === undefined) return '0';
  const num = parseFloat(quantity) || 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(num);
};
