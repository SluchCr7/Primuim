export const EXCHANGE_RATES = {
  EGP: 1.0,
  USD: 0.0208, // ~ 48 EGP
  EUR: 0.0192, // ~ 52 EGP
};

export const convertPrice = (egpAmount: number, toCurrency: "EGP" | "USD" | "EUR", rates?: Record<string, number>) => {
  const activeRates = rates || EXCHANGE_RATES;
  const rate = activeRates[toCurrency] || EXCHANGE_RATES[toCurrency];
  return egpAmount * rate;
};

export const formatPrice = (
  egpAmount: number,
  currency: "EGP" | "USD" | "EUR",
  rates?: Record<string, number>
) => {
  const converted = convertPrice(egpAmount, currency, rates);
  
  if (currency === "USD") {
    return `$${converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }
  
  if (currency === "EUR") {
    return `€${converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} EUR`;
  }
  
  return `${egpAmount.toLocaleString("en-US")} EGP`;
};
