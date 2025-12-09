// app/_layout.js
import { Stack } from "expo-router";
import { TransactionProvider } from "../context/TransactionContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TransactionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" />
          <Stack.Screen name="transaction/[id]" />
        </Stack>
      </TransactionProvider>
    </ThemeProvider>
  );
}