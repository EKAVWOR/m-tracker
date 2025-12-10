// app/(tabs)/stats.js
import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useBudget, getMonthKey } from "../../context/BudgetContext";

const formatNumber = (n = 0) =>
  Math.abs(Math.round(Number(n) || 0))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* Animations */

function FadeInSection({ delay = 0, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/* Date helpers */

function getTxDate(tx) {
  const d = tx?.date ?? tx?.createdAt ?? tx?.timestamp;
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === "string") return new Date(d);
  if (typeof d === "number") return new Date(d);
  if (d?.toDate) return d.toDate(); // Firestore Timestamp
  return null;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

// Sunday as start of week; adjust offset if Monday is preferred
function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0..6
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isInRange(tx, range) {
  if (range === "all") return true;
  const d = getTxDate(tx);
  if (!d) return range === "all";
  const now = new Date();
  if (range === "month") return d >= startOfMonth(now) && d <= now;
  if (range === "week") return d >= startOfWeek(now) && d <= now;
  return true;
}

/* UI sections */

function StatsHeader({ styles, currency, selectedRange, onChangeRange }) {
  const chips = [
    { key: "month", label: "This month" },
    { key: "week", label: "This week" },
    { key: "all", label: "All time" },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSubtitle}>
            Get a deeper insight into your income and spending.
          </Text>
        </View>

        <View style={styles.currencyPill}>
          <Text style={styles.currencyPillText}>
            {currency?.code ? `${currency.code} ` : ""}
            {currency?.symbol || ""}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {chips.map((c) => {
          const active = selectedRange === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => onChangeRange(c.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BudgetSection({
  styles,
  colors,
  currency,
  monthKey,
  loading,
  budget, // { totalBudget, ... } or null
  spentAbs, // absolute spent this month
  onPressManage,
}) {
  if (loading) {
    return (
      <FadeInSection delay={40} style={[styles.card, styles.shadowCard]}>
        <Text style={styles.sectionTitle}>Monthly Budget</Text>
        <Text style={styles.sectionSubtitle}>Loading {monthKey}...</Text>
      </FadeInSection>
    );
  }

  if (!budget) {
    return (
      <FadeInSection delay={40} style={[styles.card, styles.shadowCard]}>
        <Text style={styles.sectionTitle}>Monthly Budget</Text>
        <Text style={styles.emptyText}>
          No budget set for {monthKey}. Start a plan to track your monthly spending.
        </Text>
        <Pressable style={styles.ctaButton} onPress={onPressManage}>
          <Text style={styles.ctaButtonText}>Set monthly budget</Text>
        </Pressable>
      </FadeInSection>
    );
  }

  const total = Number(budget.totalBudget) || 0;
  const usedClamped = Math.min(spentAbs, Math.max(total, 0));
  const ratio = total > 0 ? Math.min(1, usedClamped / total) : 0;
  const percent = total > 0 ? Math.round((spentAbs / total) * 100) : 0;
  const remaining = total - spentAbs;
  const over = remaining < 0;

  return (
    <FadeInSection delay={40} style={[styles.card, styles.shadowCard]}>
      <Text style={styles.sectionTitle}>Monthly Budget</Text>
      <Text style={styles.sectionSubtitle}>Plan for {monthKey}</Text>

      <View style={styles.overviewRow}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Budget</Text>
          <Text style={[styles.overviewValue, { color: colors.accentBlue }]}>
            {currency.symbol}
            {formatNumber(total)}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Spent</Text>
          <Text style={[styles.overviewValue, { color: "#FF5B5B" }]}>
            -{currency.symbol}
            {formatNumber(spentAbs)}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>{over ? "Over" : "Remaining"}</Text>
          <Text
            style={[
              styles.overviewValue,
              { color: over ? "#FF5B5B" : colors.accentGreen },
            ]}
          >
            {over ? "-" : ""}
            {currency.symbol}
            {formatNumber(Math.abs(remaining))}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {Math.abs(percent)}% of budget used
        </Text>
        <Text style={styles.progressLabelSecondary}>
          {over ? "Over by" : "Left"}: {currency.symbol}
          {formatNumber(Math.abs(remaining))}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: over ? "#FF5B5B" : colors.accentBlue,
            },
          ]}
        />
      </View>

      <Pressable
        style={[styles.ctaButton, { marginTop: 10, backgroundColor: COLORS_TO_RGBA(colors.accentBlue, 0.12) }]}
        onPress={onPressManage}
      >
        <Text style={[styles.ctaButtonText, { color: colors.accentBlue }]}>
          Manage budget
        </Text>
      </Pressable>
    </FadeInSection>
  );
}

function OverviewSection({
  styles,
  colors,
  income,
  expenses,
  balance,
  count,
  currency,
}) {
  const spentAbs = Math.abs(expenses);
  const ratio = income > 0 ? Math.min(1, spentAbs / income) : 0;
  const percent = income > 0 ? Math.round((spentAbs / income) * 100) : 0;

  return (
    <FadeInSection delay={80} style={[styles.card, styles.shadowCard]}>
      <Text style={styles.sectionTitle}>Overview</Text>
      <Text style={styles.sectionSubtitle}>
        {count} transaction{count === 1 ? "" : "s"} in this period.
      </Text>

      <View style={styles.overviewRow}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Income</Text>
          <Text style={[styles.overviewValue, { color: colors.accentGreen }]}>
            {currency.symbol}
            {formatNumber(income)}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Expenses</Text>
          <Text style={[styles.overviewValue, { color: "#FF5B5B" }]}>
            -{currency.symbol}
            {formatNumber(spentAbs)}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Balance</Text>
          <Text style={styles.overviewValue}>
            {currency.symbol}
            {formatNumber(balance)}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{percent}% of income spent</Text>
        <Text style={styles.progressLabelSecondary}>
          Remaining: {currency.symbol}
          {formatNumber(income - spentAbs)}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${ratio * 100}%`, backgroundColor: colors.accentGreen },
          ]}
        />
      </View>
    </FadeInSection>
  );
}

function ActivitySection({ styles, colors, transactions, currency }) {
  const last7 = [...transactions].filter((t) => t.amount < 0).slice(-7).reverse();

  if (last7.length === 0) {
    return (
      <FadeInSection
        delay={160}
        style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
      >
        <Text style={styles.sectionTitle}>Spending activity</Text>
        <Text style={styles.emptyText}>
          You don’t have any expense transactions yet.
        </Text>
      </FadeInSection>
    );
  }

  const maxAbs = Math.max(...last7.map((t) => Math.abs(t.amount)), 1);

  return (
    <FadeInSection
      delay={160}
      style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
    >
      <Text style={styles.sectionTitle}>Spending activity</Text>
      <Text style={styles.sectionSubtitle}>
        Last {last7.length} expense transaction{last7.length === 1 ? "" : "s"}.
      </Text>

      {last7.map((t) => {
        const ratio = Math.abs(t.amount) / maxAbs;
        return (
          <View key={t.id} style={styles.barRow}>
            <View style={styles.barLabelCol}>
              <Text style={styles.barTitle} numberOfLines={1}>
                {t.title}
              </Text>
              {t.date && <Text style={styles.barSubtitle}>{t.date}</Text>}
            </View>

            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(0.18, ratio) * 100}%`,
                    backgroundColor: colors.accentBlue,
                  },
                ]}
              />
            </View>

            <Text style={styles.barAmount}>
              {currency.symbol}
              {formatNumber(Math.abs(t.amount))}
            </Text>
          </View>
        );
      })}
    </FadeInSection>
  );
}

function IncomeVsExpenseSection({
  styles,
  colors,
  income,
  expenses,
  currency,
}) {
  const spentAbs = Math.abs(expenses);
  const total = income + spentAbs || 1;
  const incomeRatio = income / total;
  const expenseRatio = spentAbs / total;

  return (
    <FadeInSection
      delay={240}
      style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
    >
      <Text style={styles.sectionTitle}>Income vs Expenses</Text>

      <View style={styles.splitBarBackground}>
        <View
          style={[
            styles.splitBarSegment,
            { flex: incomeRatio || 0, backgroundColor: colors.accentGreen },
          ]}
        />
        <View
          style={[
            styles.splitBarSegment,
            { flex: expenseRatio || 0, backgroundColor: "#FF5B5B" },
          ]}
        />
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.accentGreen }]}
          />
          <Text style={styles.legendText}>
            Income • {currency.symbol}
            {formatNumber(income)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF5B5B" }]} />
          <Text style={styles.legendText}>
            Expenses • {currency.symbol}
            {formatNumber(spentAbs)}
          </Text>
        </View>
      </View>
    </FadeInSection>
  );
}

/* Screen */

export default function StatsScreen() {
  const router = useRouter();
  const { transactions } = useTransactions();
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const { loading: budgetLoading, getBudgetForMonth } = useBudget();

  const [selectedRange, setSelectedRange] = useState("month"); // month | week | all
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Filter transactions by selected range
  const filteredTransactions = useMemo(
    () => transactions.filter((t) => isInRange(t, selectedRange)),
    [transactions, selectedRange]
  );

  // Period stats
  const { income, expenses, balance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (amt > 0) income += amt;
      else if (amt < 0) expenses += amt;
    });
    return { income, expenses, balance: income + expenses };
  }, [filteredTransactions]);

  // Budget is always for the current month
  const monthKey = useMemo(() => getMonthKey(new Date()), []);
  const monthlyBudget = getBudgetForMonth(monthKey);

  // Spent this month (absolute)
  const spentThisMonthAbs = useMemo(() => {
    const now = new Date();
    const som = startOfMonth(now);
    let total = 0;
    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (amt >= 0) return;
      const d = getTxDate(t);
      if (!d) return;
      if (d >= som && d <= now) total += Math.abs(amt);
    });
    return total;
  }, [transactions]);

  const openBudget = () => router.push("/budget");

  return (
    <View style={styles.container}>
      <StatsHeader
        styles={styles}
        currency={currency}
        selectedRange={selectedRange}
        onChangeRange={setSelectedRange}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly budget (current month only) */}
        <BudgetSection
          styles={styles}
          colors={colors}
          currency={currency}
          monthKey={monthKey}
          loading={budgetLoading}
          budget={monthlyBudget}
          spentAbs={spentThisMonthAbs}
          onPressManage={openBudget}
        />

        <OverviewSection
          styles={styles}
          colors={colors}
          income={income}
          expenses={expenses}
          balance={balance}
          count={filteredTransactions.length}
          currency={currency}
        />

        <ActivitySection
          styles={styles}
          colors={colors}
          transactions={filteredTransactions}
          currency={currency}
        />

        <IncomeVsExpenseSection
          styles={styles}
          colors={colors}
          income={income}
          expenses={expenses}
          currency={currency}
        />
      </ScrollView>
    </View>
  );
}

/* Themed styles */

function COLORS_TO_RGBA(hexOrColor, alpha = 1) {
  // naive rgba helper for accentBlue; if color is already rgba, return it
  if (!hexOrColor || typeof hexOrColor !== "string") return `rgba(0,0,0,${alpha})`;
  if (hexOrColor.startsWith("rgba") || hexOrColor.startsWith("rgb")) return hexOrColor;
  // Expect #RRGGBB
  const hex = hexOrColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    scroll: {
      flex: 1,
    },

    header: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 18,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
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
      opacity: 0.9,
    },
    currencyPill: {
      alignSelf: "flex-start",
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginLeft: 8,
    },
    currencyPillText: {
      fontSize: 12,
      color: COLORS.text,
      fontWeight: "600",
    },

    chipRow: {
      flexDirection: "row",
      marginTop: 14,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: COLORS.card,
      borderColor: "transparent",
    },
    chipText: {
      fontSize: 12,
      color: COLORS.textMuted,
    },
    chipTextActive: {
      color: COLORS.text,
      fontWeight: "600",
    },

    card: {
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 16,
    },
    shadowCard: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: COLORS.text,
    },
    sectionSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: COLORS.textMuted,
    },

    overviewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
    overviewItem: {
      flex: 1,
      marginHorizontal: 4,
    },
    overviewLabel: {
      fontSize: 12,
      color: COLORS.textMuted,
    },
    overviewValue: {
      marginTop: 2,
      fontSize: 16,
      fontWeight: "700",
      color: COLORS.text,
    },

    progressRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
    progressLabel: {
      fontSize: 12,
      color: COLORS.text,
      fontWeight: "600",
    },
    progressLabelSecondary: {
      fontSize: 12,
      color: COLORS.textMuted,
    },
    progressBarBackground: {
      marginTop: 8,
      height: 10,
      borderRadius: 999,
      backgroundColor: COLORS.border,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: COLORS.accentGreen,
    },

    emptyText: {
      marginTop: 8,
      fontSize: 13,
      color: COLORS.textMuted,
    },

    barRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    barLabelCol: {
      flex: 1.2,
      marginRight: 8,
    },
    barTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.text,
    },
    barSubtitle: {
      fontSize: 11,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    barContainer: {
      flex: 2,
      height: 8,
      borderRadius: 999,
      backgroundColor: COLORS.border,
      overflow: "hidden",
      marginRight: 8,
    },
    barFill: {
      flex: 1,
      borderRadius: 999,
    },
    barAmount: {
      width: 70,
      fontSize: 12,
      fontWeight: "600",
      color: COLORS.text,
      textAlign: "right",
    },

    splitBarBackground: {
      marginTop: 16,
      height: 18,
      borderRadius: 999,
      overflow: "hidden",
      flexDirection: "row",
    },
    splitBarSegment: {
      height: "100%",
    },
    legendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: COLORS.text,
    },

    ctaButton: {
      marginTop: 12,
      alignSelf: "flex-start",
      backgroundColor: COLORS.accentBlue,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    ctaButtonText: {
      color: "white",
      fontWeight: "700",
      fontSize: 13,
    },
  });