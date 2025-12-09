// app/(tabs)/stats.js
import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";

const formatNumber = (n = 0) =>
  Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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

/* Components */

function StatsHeader({ styles }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Statistics</Text>
      <Text style={styles.headerSubtitle}>
        Get a deeper insight into your income and spending.
      </Text>

      <View style={styles.chipRow}>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={[styles.chipText, styles.chipTextActive]}>
            This month
          </Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>This week</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>All time</Text>
        </View>
      </View>
    </View>
  );
}

function OverviewSection({ styles, colors, income, expenses, balance, count }) {
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
          <Text
            style={[
              styles.overviewValue,
              { color: colors.accentGreen },
            ]}
          >
            ₦{formatNumber(income)}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Expenses</Text>
          <Text style={[styles.overviewValue, { color: "#FF5B5B" }]}>
            -₦{formatNumber(spentAbs)}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Balance</Text>
          <Text style={styles.overviewValue}>
            ₦{formatNumber(balance)}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {percent}% of income spent
        </Text>
        <Text style={styles.progressLabelSecondary}>
          Remaining: ₦{formatNumber(income - spentAbs)}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${ratio * 100}%` },
          ]}
        />
      </View>
    </FadeInSection>
  );
}

function ActivitySection({ styles, colors, transactions }) {
  const last7 = [...transactions]
    .filter((t) => t.amount < 0)
    .slice(-7)
    .reverse();

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
        Last {last7.length} expense transaction
        {last7.length === 1 ? "" : "s"}.
      </Text>

      {last7.map((t) => {
        const ratio = Math.abs(t.amount) / maxAbs;
        return (
          <View key={t.id} style={styles.barRow}>
            <View style={styles.barLabelCol}>
              <Text style={styles.barTitle} numberOfLines={1}>
                {t.title}
              </Text>
              {t.date && (
                <Text style={styles.barSubtitle}>{t.date}</Text>
              )}
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
              ₦{formatNumber(Math.abs(t.amount))}
            </Text>
          </View>
        );
      })}
    </FadeInSection>
  );
}

function IncomeVsExpenseSection({ styles, colors, income, expenses }) {
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
            style={[
              styles.legendDot,
              { backgroundColor: colors.accentGreen },
            ]}
          />
          <Text style={styles.legendText}>
            Income • ₦{formatNumber(income)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: "#FF5B5B" },
            ]}
          />
          <Text style={styles.legendText}>
            Expenses • ₦{formatNumber(spentAbs)}
          </Text>
        </View>
      </View>
    </FadeInSection>
  );
}

/* Screen */

export default function StatsScreen() {
  const { transactions } = useTransactions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { income, expenses, balance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else if (t.amount < 0) expenses += t.amount;
    });
    return { income, expenses, balance: income + expenses };
  }, [transactions]);

  return (
    <View style={styles.container}>
      <StatsHeader styles={styles} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <OverviewSection
          styles={styles}
          colors={colors}
          income={income}
          expenses={expenses}
          balance={balance}
          count={transactions.length}
        />
        <ActivitySection
          styles={styles}
          colors={colors}
          transactions={transactions}
        />
        <IncomeVsExpenseSection
          styles={styles}
          colors={colors}
          income={income}
          expenses={expenses}
        />
      </ScrollView>
    </View>
  );
}

/* Themed styles */

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
      paddingTop: 20,
      paddingBottom: 18,
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
  });