// app/_layout.js
import { Stack } from "expo-router";

import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { TransactionProvider } from "../context/TransactionContext";
import { BudgetProvider } from "../context/BudgetContext";
import { CurrencyProvider } from "../context/CurrencyContext"; // 👈 add this

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" />
      <Stack.Screen name="transaction/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>          {/* 👈 wrap app with currency */}
          <BudgetProvider>          {/* needs Auth (already inside) */}
            <TransactionProvider>
              <RootNavigator />
            </TransactionProvider>
          </BudgetProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}