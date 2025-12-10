// context/CurrencyContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mtracker/currency";

const CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "₦ Nigerian Naira" },
  { code: "USD", symbol: "$", label: "$ US Dollar" },
  { code: "EUR", symbol: "€", label: "€ Euro" },
  { code: "GBP", symbol: "£", label: "£ British Pound" },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState("NGN");
  const [loading, setLoading] = useState(true);

  // Load saved currency once on mount
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setCode(saved);
      } catch (e) {
        console.warn("Failed to load currency", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Persist whenever it changes
  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, code).catch((e) =>
      console.warn("Failed to save currency", e)
    );
  }, [code, loading]);

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.code === code) || CURRENCIES[0],
    [code]
  );

  const value = useMemo(
    () => ({
      loading,
      currency,           // { code, symbol, label }
      code,
      setCode,
      currencies: CURRENCIES,
    }),
    [loading, currency, code]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}