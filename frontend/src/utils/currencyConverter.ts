/**
 * Multi-source currency converter
 * Fetches rates from 3 different sources and uses median value
 */

interface ExchangeRates {
  USD: number;
  RUB: number;
  UZS: number;
  UAH: number;
}

interface RateSource {
  name: string;
  fetch: () => Promise<ExchangeRates>;
}

// Source 1: ExchangeRate-API
const fetchFromExchangeRateAPI = async (): Promise<ExchangeRates> => {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await response.json();
  return {
    USD: 1,
    RUB: data.rates.RUB || 90,
    UZS: data.rates.UZS || 12500,
    UAH: data.rates.UAH || 41
  };
};

// Source 2: Open Exchange Rates (free tier)
const fetchFromOpenExchangeRates = async (): Promise<ExchangeRates> => {
  const response = await fetch('https://open.er-api.com/v6/latest/USD');
  const data = await response.json();
  return {
    USD: 1,
    RUB: data.rates.RUB || 90,
    UZS: data.rates.UZS || 12500,
    UAH: data.rates.UAH || 41
  };
};

// Source 3: Frankfurter (European Central Bank)
const fetchFromFrankfurter = async (): Promise<ExchangeRates> => {
  const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=RUB,UZS,UAH');
  const data = await response.json();
  return {
    USD: 1,
    RUB: data.rates.RUB || 90,
    UZS: data.rates.UZS || 12500,
    UAH: data.rates.UAH || 41
  };
};

const sources: RateSource[] = [
  { name: 'ExchangeRate-API', fetch: fetchFromExchangeRateAPI },
  { name: 'OpenExchangeRates', fetch: fetchFromOpenExchangeRates },
  { name: 'Frankfurter', fetch: fetchFromFrankfurter }
];

// Calculate median of three values
const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[1]; // Middle value
};

// Fetch rates from all sources and return median
export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  const results = await Promise.allSettled(
    sources.map(source => source.fetch())
  );

  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<ExchangeRates> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);

  if (successfulResults.length === 0) {
    // Fallback rates if all sources fail
    return {
      USD: 1,
      RUB: 90,
      UZS: 12500,
      UAH: 41
    };
  }

  // Calculate median for each currency
  return {
    USD: 1,
    RUB: median(successfulResults.map(r => r.RUB)),
    UZS: median(successfulResults.map(r => r.UZS)),
    UAH: median(successfulResults.map(r => r.UAH))
  };
};

// Convert USD to target currency
export const convertCurrency = (
  amountUSD: number,
  targetCurrency: keyof ExchangeRates,
  rates: ExchangeRates
): number => {
  return Math.round(amountUSD * rates[targetCurrency]);
};

// Cache rates for 1 hour
let cachedRates: ExchangeRates | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const getCachedRates = async (): Promise<ExchangeRates> => {
  const now = Date.now();
  
  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRates;
  }

  cachedRates = await fetchExchangeRates();
  cacheTimestamp = now;
  return cachedRates;
};
