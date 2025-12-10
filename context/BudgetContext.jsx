// context/BudgetContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

const BudgetContext = createContext(null);

// Month key like "2025-01"
export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function BudgetProvider({ children }) {
  const [budgets, setBudgets] = useState({}); // { '2025-01': { totalBudget, monthKey, ... } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setBudgets({});
        setLoading(false);
        return;
      }

      const colRef = collection(db, "users", user.uid, "budgets");
      const unsubBudgets = onSnapshot(
        colRef,
        (snap) => {
          const map = {};
          snap.forEach((d) => {
            map[d.id] = d.data();
          });
          setBudgets(map);
          setLoading(false);
        },
        (err) => {
          console.warn("Budget listener error", err);
          setLoading(false);
        }
      );

      return unsubBudgets;
    });

    return unsubAuth;
  }, []);

  const requireUid = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not logged in");
    return uid;
  };

  const getBudgetForMonth = (monthKey) => budgets[monthKey] || null;

  // User "subscribes" to a monthly plan by saving a budget for that month
  const setMonthlyBudget = async (monthKey, { totalBudget }) => {
    const uid = requireUid();
    const docRef = doc(db, "users", uid, "budgets", monthKey);
    const now = new Date().toISOString();

    await setDoc(
      docRef,
      {
        monthKey,
        totalBudget: Number(totalBudget),
        active: true,          // mark this month as having an active plan
        updatedAt: now,
        createdAt: budgets[monthKey]?.createdAt || now,
      },
      { merge: true }
    );
  };

  const value = useMemo(
    () => ({
      loading,
      budgets,
      getBudgetForMonth,
      setMonthlyBudget,
      getMonthKey,
    }),
    [loading, budgets]
  );

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return ctx;
}