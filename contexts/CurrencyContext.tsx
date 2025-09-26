import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

const CURRENCY_STORAGE_KEY = 'selectedCurrency';

export const currencyOptions: CurrencyOption[] = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', label: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', label: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
];

const DEFAULT_CURRENCY: CurrencyCode = 'INR';

interface CurrencyContextType {
  currency: CurrencyCode;
  currencySymbol: string;
  availableCurrencies: CurrencyOption[];
  setCurrency: (code: CurrencyCode) => Promise<void>;
  formatCurrency: (value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
  formatNumber: (value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

const createCurrencyFormatter = (
  option: CurrencyOption,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
) =>
  new Intl.NumberFormat(option.locale || 'en-IN', {
    style: 'currency',
    currency: option.code,
    minimumFractionDigits,
    maximumFractionDigits,
  });

const createNumberFormatter = (option: CurrencyOption, minimumFractionDigits = 0, maximumFractionDigits = 2) =>
  new Intl.NumberFormat(option.locale || 'en-IN', {
    style: 'decimal',
    minimumFractionDigits,
    maximumFractionDigits,
  });

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [currencyOption, setCurrencyOption] = useState<CurrencyOption>(currencyOptions[0]);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const storedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (storedCurrency) {
          const option = currencyOptions.find((opt) => opt.code === storedCurrency);
          if (option) {
            setCurrencyState(option.code);
            setCurrencyOption(option);
          }
        }
      } catch (error) {
        console.error('Error loading saved currency:', error);
      }
    };

    loadCurrency();
  }, []);

  useEffect(() => {
    const option = currencyOptions.find((opt) => opt.code === currency) || currencyOptions[0];
    setCurrencyOption(option);
  }, [currency]);

  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyOption), [currencyOption]);

  const numberFormatter = useMemo(() => createNumberFormatter(currencyOption), [currencyOption]);

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    try {
      const option = currencyOptions.find((opt) => opt.code === code) || currencyOptions[0];
      setCurrencyState(option.code);
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, option.code);
    } catch (error) {
      console.error('Error saving currency selection:', error);
    }
  }, []);

  const formatCurrency = useCallback(
    (value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return currencyFormatter.format(0);
      }

      if (options) {
        return createCurrencyFormatter(
          currencyOption,
          options.minimumFractionDigits ?? 2,
          options.maximumFractionDigits ?? 2
        ).format(value);
      }

      return currencyFormatter.format(value);
    },
    [currencyFormatter, currencyOption]
  );

  const formatNumber = useCallback(
    (value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return numberFormatter.format(0);
      }

      if (options) {
        return createNumberFormatter(
          currencyOption,
          options.minimumFractionDigits ?? 0,
          options.maximumFractionDigits ?? 2
        ).format(value);
      }

      return numberFormatter.format(value);
    },
    [numberFormatter, currencyOption]
  );

  const value: CurrencyContextType = {
    currency,
    currencySymbol: currencyOption.symbol,
    availableCurrencies: currencyOptions,
    setCurrency,
    formatCurrency,
    formatNumber,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
