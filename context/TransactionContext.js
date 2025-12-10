// context/TransactionContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const TransactionContext = createContext(null);

// Remove any fields that are undefined (Firestore doesn't allow undefined)
function cleanData(obj) {
  const out = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      out[key] = value;
    }
  });
  return out;
}

// Default categories
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "bills", label: "Bills" },
  { id: "shopping", label: "Shopping" },
  { id: "entertainment", label: "Entertainment" },
  { id: "other-expense", label: "Other" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: "salary", label: "Salary" },
  { id: "freelance", label: "Freelance" },
  { id: "bonus", label: "Bonus" },
  { id: "investment", label: "Investment" },
  { id: "other-income", label: "Other income" },
];

export function TransactionProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState(
    DEFAULT_EXPENSE_CATEGORIES
  );
  const [incomeCategories, setIncomeCategories] = useState(
    DEFAULT_INCOME_CATEGORIES
  );
  const [loading, setLoading] = useState(true);

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return unsub;
  }, []);

  // Subscribe to user transactions in Firestore
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "users", userId, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data };
        });
        setTransactions(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Error listening to transactions:", error);
        setLoading(false);
      }
    );

    return unsub;
  }, [userId]);

  const requireUserId = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not logged in");
    return uid;
  };

  // ---- CRUD operations ----

  const addTransaction = async (tx) => {
    const uid = requireUserId();
    const id = tx.id || Date.now().toString();
    const docRef = doc(db, "users", uid, "transactions", id);

    const data = cleanData({ ...tx, id }); // strip undefined fields
    await setDoc(docRef, data);
  };

  const updateTransaction = async (id, updates) => {
    const uid = requireUserId();
    const docRef = doc(db, "users", uid, "transactions", id);

    const data = cleanData(updates); // strip undefined fields
    await updateDoc(docRef, data);
  };

  const deleteTransaction = async (id) => {
    const uid = requireUserId();
    const docRef = doc(db, "users", uid, "transactions", id);
    await deleteDoc(docRef);
  };

  // ---- local categories ----

  const addCategory = (kind, name) => {
    const label = name.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "-");

    if (kind === "income") {
      setIncomeCategories((prev) => {
        if (prev.some((c) => c.label.toLowerCase() === label.toLowerCase()))
          return prev;
        return [...prev, { id, label }];
      });
    } else {
      setExpenseCategories((prev) => {
        if (prev.some((c) => c.label.toLowerCase() === label.toLowerCase()))
          return prev;
        return [...prev, { id, label }];
      });
    }
  };

  const value = {
    loading,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    expenseCategories,
    incomeCategories,
    addCategory,
    // expose setTransactions for your Danger zone reset
    setTransactions,
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