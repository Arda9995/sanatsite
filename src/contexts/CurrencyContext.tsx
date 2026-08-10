import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type Currency = 'USD' | 'EUR' | 'TRY' | 'GBP';

interface ExchangeRates {
  USD: number;
  EUR: number;
  TRY: number;
  GBP: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number, baseCurrency?: Currency) => string;
  convertPrice: (price: number, fromCurrency: Currency, toCurrency: Currency) => number;
  exchangeRates: ExchangeRates;
  refreshRates: () => Promise<void>;
  userCountry: string;
  isTurkeyUser: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencySymbols = {
  USD: '$',
  EUR: '€',
  TRY: '₺',
  GBP: '£'
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [userCountry, setUserCountry] = useState<string>('UNKNOWN');

  const isTurkeyVisitor = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang = navigator.language || '';
      return tz.includes('Istanbul') || lang.startsWith('tr');
    } catch (e) {
      return false;
    }
  };

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    if (saved && ['USD', 'EUR', 'TRY', 'GBP'].includes(saved)) {
      return saved as Currency;
    }
    return isTurkeyVisitor() ? 'TRY' : 'EUR';
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1.08,
    EUR: 1,
    TRY: 37.50,
    GBP: 0.86
  });

  useEffect(() => {
    // Detect country via IP
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country_code) {
          setUserCountry(data.country_code);
          const saved = localStorage.getItem('currency');
          if (!saved) {
            setCurrencyState(data.country_code === 'TR' ? 'TRY' : 'EUR');
          }
        }
      })
      .catch(() => {
        setUserCountry(isTurkeyVisitor() ? 'TR' : 'FOREIGN');
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('currency, rate');

    if (!error && data) {
      const rates: any = {};
      (data as any[]).forEach((item) => {
        rates[item.currency] = item.rate;
      });
      setExchangeRates(rates as ExchangeRates);
    }
  };

  const refreshRates = async () => {
    await loadExchangeRates();
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const convertPrice = (price: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return price;

    // Convert to EUR first (EUR is the anchor)
    const priceInEUR = fromCurrency === 'EUR' ? price : price / exchangeRates[fromCurrency];
    const converted = priceInEUR * exchangeRates[toCurrency];

    if (isNaN(converted)) {
      console.warn('Currency conversion resulted in NaN:', { price, fromCurrency, toCurrency, exchangeRates });
    }

    return converted;
  };

  const formatPrice = (price: number, baseCurrency: Currency = 'EUR'): string => {
    const convertedPrice = convertPrice(price, baseCurrency, currency);
    const symbol = currencySymbols[currency];
    const formattedNumber = convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // In Turkey, the symbol typically follows the amount (e.g., 100,00 ₺)
    if (currency === 'TRY') {
      return `${formattedNumber} ${symbol}`;
    }

    return `${symbol}${formattedNumber}`;
  };

  const isTurkeyUser = userCountry === 'TR' || (userCountry === 'UNKNOWN' && isTurkeyVisitor());

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice, exchangeRates, refreshRates, userCountry, isTurkeyUser }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
