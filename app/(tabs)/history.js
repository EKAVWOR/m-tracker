// app/(tabs)/history.js
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/CurrencyContext";   // 👈 NEW

const formatNumber = (n = 0) =>
  Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function formatDateKey(dateStr) {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? "Unknown"
    : d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatSectionTitle(key) {
  if (key === "Unknown") return "Unknown date";
  const d = new Date(key);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yKey = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);

  if (key === todayKey) return "Today";
  if (key === yKey) return "Yesterday";
  return d.toLocaleDateString();
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { transactions } = useTransactions();
  const { colors } = useTheme();
  const { currency } = useCurrency();                         // 👈 NEW
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sections = useMemo(() => {
    if (!transactions.length) return [];

    const groups = {};
    transactions.forEach((tx) => {
      const key = formatDateKey(tx.createdAt || tx.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return keys.map((key) => ({
      title: formatSectionTitle(key),
      data: groups[key].sort((a, b) => {
        const aT = new Date(a.createdAt || a.date).getTime();
        const bT = new Date(b.createdAt || b.date).getTime();
        return bT - aT; // newest first
      }),
    }));
  }, [transactions]);

  if (!transactions.length) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={styles.emptyText}>
          You don’t have any transactions yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>
          All your transactions, grouped by date.
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => {
          const isIncome = item.amount > 0;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/transaction/${item.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{item.title}</Text>
                {item.note && (
                  <Text style={styles.txNote} numberOfLines={1}>
                    {item.note}
                  </Text>
                )}
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={[
                    styles.txAmount,
                    isIncome ? styles.income : styles.expense,
                  ]}
                >
                  {isIncome ? "+" : "-"}
                  {currency.symbol}
                  {formatNumber(Math.abs(item.amount))}
                </Text>
                <Text style={styles.txTime}>
                  {formatTime(item.createdAt || item.date)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: COLORS.text,
    },
    headerSubtitle: {
      marginTop: 6,
      fontSize: 13,
      color: COLORS.text,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionHeader: {
      marginTop: 12,
      marginBottom: 4,
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.textMuted,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 6,
      borderRadius: 12,
      backgroundColor: COLORS.card,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    txTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.text,
    },
    txNote: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    txAmount: {
      fontSize: 14,
      fontWeight: "700",
    },
    income: {
      color: COLORS.accentGreen,
    },
    expense: {
      color: "#FF5B5B",
    },
    txTime: {
      fontSize: 11,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 14,
      color: COLORS.textMuted,
    },
  });