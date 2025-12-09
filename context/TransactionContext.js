// context/TransactionContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TransactionContext = createContext(null);

const STORAGE_KEYS = {
  transactions: "@mtracker/transactions",
  expenseCategories: "@mtracker/expenseCategories",
  incomeCategories: "@mtracker/incomeCategories",
};

// Default expense categories
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "bills", label: "Bills" },
  { id: "shopping", label: "Shopping" },
  { id: "entertainment", label: "Entertainment" },
  { id: "other-expense", label: "Other" },
];

// Default income categories
const DEFAULT_INCOME_CATEGORIES = [
  { id: "salary", label: "Salary" },
  { id: "freelance", label: "Freelance" },
  { id: "bonus", label: "Bonus" },
  { id: "investment", label: "Investment" },
  { id: "other-income", label: "Other income" },
];

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState(
    DEFAULT_EXPENSE_CATEGORIES
  );
  const [incomeCategories, setIncomeCategories] = useState(
    DEFAULT_INCOME_CATEGORIES
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [txStr, expStr, incStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.transactions),
          AsyncStorage.getItem(STORAGE_KEYS.expenseCategories),
          AsyncStorage.getItem(STORAGE_KEYS.incomeCategories),
        ]);

        if (txStr) {
          const parsed = JSON.parse(txStr);
          if (Array.isArray(parsed)) setTransactions(parsed);
        }
        if (expStr) {
          const parsed = JSON.parse(expStr);
          if (Array.isArray(parsed)) setExpenseCategories(parsed);
        }
        if (incStr) {
          const parsed = JSON.parse(incStr);
          if (Array.isArray(parsed)) setIncomeCategories(parsed);
        }
      } catch (e) {
        console.warn("Failed to load stored data", e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Persist changes
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.transactions,
      JSON.stringify(transactions)
    ).catch((e) => console.warn("Failed to save transactions", e));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.expenseCategories,
      JSON.stringify(expenseCategories)
    ).catch((e) => console.warn("Failed to save expense categories", e));
  }, [expenseCategories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.incomeCategories,
      JSON.stringify(incomeCategories)
    ).catch((e) => console.warn("Failed to save income categories", e));
  }, [incomeCategories, isLoaded]);

  // API
  const addTransaction = (tx) => {
    setTransactions((prev) => [...prev, tx]);
  };

  const updateTransaction = (id, updates) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // kind: "expense" | "income"
  const addCategory = (kind, name) => {
    const label = name.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "-");

    if (kind === "income") {
      setIncomeCategories((prev) => {
        const exists = prev.some(
          (c) => c.label.toLowerCase() === label.toLowerCase()
        );
        return exists ? prev : [...prev, { id, label }];
      });
    } else {
      setExpenseCategories((prev) => {
        const exists = prev.some(
          (c) => c.label.toLowerCase() === label.toLowerCase()
        );
        return exists ? prev : [...prev, { id, label }];
      });
    }
  };

  const value = {
    isLoaded,
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    expenseCategories,
    incomeCategories,
    addCategory,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) {
    throw new Error(
      "useTransactions must be used within a TransactionProvider"
    );
  }
  return ctx;
}