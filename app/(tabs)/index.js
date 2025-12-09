// app/(tabs)/index.js
import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Animated,
} from "react-native";
import { Link } from "expo-router";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";
import Logo from "../../assets/images/m-tracker-logo.png"; // update path if needed

const formatNumber = (n = 0) =>
  Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function FadeInSection({ delay = 0, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
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

/* ---------- Section components (get styles/colors via props) ---------- */

function HeaderSection({ styles }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.logoWrapper}>
          <Image source={Logo} style={styles.logo} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>M- Tracker</Text>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subTitle}>
            Here’s a quick snapshot of your finances today.
          </Text>
        </View>
      </View>
    </View>
  );
}

function DashboardSummary({ styles, colors, income, expenses, balance }) {
  const totalExpensesAbs = Math.abs(expenses);

  return (
    <FadeInSection delay={80} style={[styles.sectionCard, styles.shadowCard]}>
      <Text style={styles.sectionTitle}>Dashboard</Text>

      <View style={styles.dashboardRow}>
        <View style={[styles.metricCard, styles.incomeCard]}>
          <Text style={styles.metricLabel}>Income</Text>
          <Text style={styles.metricValue}>₦{formatNumber(income)}</Text>
        </View>

        <View style={[styles.metricCard, styles.expenseCard]}>
          <Text style={styles.metricLabel}>Expenses</Text>
          <Text style={styles.metricValue}>
            -₦{formatNumber(totalExpensesAbs)}
          </Text>
        </View>
      </View>

      <View style={[styles.metricCard, styles.balanceCard]}>
        <Text style={styles.metricLabel}>Balance</Text>
        <Text style={styles.metricValue}>₦{formatNumber(balance)}</Text>
      </View>
    </FadeInSection>
  );
}

function RecentTransactionsSection({ styles, transactions }) {
  const recent = [...transactions].slice(-5).reverse();

  return (
    <FadeInSection
      delay={160}
      style={[styles.sectionCard, styles.shadowCard, { marginTop: 18 }]}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
      </View>

      {recent.length === 0 ? (
        <Text style={styles.emptyText}>
          No transactions yet. Start by adding your first one.
        </Text>
      ) : (
        recent.map((item) => {
          const isIncome = item.amount > 0;
          return (
            <Link key={item.id} href={`/transaction/${item.id}`} asChild>
              <TouchableOpacity
                style={styles.transactionRow}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.transactionTitle}>{item.title}</Text>
                  {item.date && (
                    <Text style={styles.transactionDate}>{item.date}</Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    isIncome
                      ? styles.amountIncome
                      : styles.amountExpense,
                  ]}
                >
                  {isIncome ? "+" : "-"}₦
                  {formatNumber(Math.abs(item.amount))}
                </Text>
              </TouchableOpacity>
            </Link>
          );
        })
      )}
    </FadeInSection>
  );
}

function StatisticsPreview({ styles, colors, income, expenses }) {
  const spent = Math.abs(expenses);
  const ratio = income > 0 ? Math.min(1, spent / income) : 0;
  const percent = income > 0 ? Math.round((spent / income) * 100) : 0;

  return (
    <FadeInSection
      delay={240}
      style={[styles.sectionCard, styles.shadowCard, { marginTop: 18 }]}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <Link href="/(tabs)/stats" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>Open full stats</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.statsSummaryText}>
        You’ve spent {percent}% of your income in this period.
      </Text>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${ratio * 100}%` },
          ]}
        />
      </View>

      <View style={styles.statsFooterRow}>
        <View style={styles.statsPill}>
          <View
            style={[
              styles.statsDot,
              { backgroundColor: colors.accentBlue },
            ]}
          />
          <Text style={styles.statsPillText}>
            Income ₦{formatNumber(income)}
          </Text>
        </View>
        <View style={styles.statsPill}>
          <View
            style={[
              styles.statsDot,
              { backgroundColor: colors.accentGreen },
            ]}
          />
          <Text style={styles.statsPillText}>
            Expenses ₦{formatNumber(spent)}
          </Text>
        </View>
      </View>
    </FadeInSection>
  );
}

/* ---------- Screen ---------- */

export default function HomeScreen() {
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
      <HeaderSection styles={styles} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardSummary
          styles={styles}
          colors={colors}
          income={income}
          expenses={expenses}
          balance={balance}
        />
        <RecentTransactionsSection
          styles={styles}
          transactions={transactions}
        />
        <StatisticsPreview
          styles={styles}
          colors={colors}
          income={income}
          expenses={expenses}
        />
      </ScrollView>

      <Link href="/add" asChild>
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

/* ---------- Themed styles ---------- */

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 80,
      paddingTop: 10,
    },

    header: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoWrapper: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.7)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    logo: {
      width: 44,
      height: 44,
      resizeMode: "contain",
    },
    headerTextContainer: {
      flex: 1,
    },
    appName: {
      fontSize: 20,
      fontWeight: "800",
      color: COLORS.text,
    },
    welcomeText: {
      fontSize: 16,
      fontWeight: "600",
      color: COLORS.text,
      marginTop: 2,
    },
    subTitle: {
      fontSize: 13,
      color: COLORS.text,
      opacity: 0.9,
      marginTop: 4,
    },

    sectionCard: {
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
      marginBottom: 6,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },

    dashboardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    metricCard: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    incomeCard: {
      marginRight: 8,
      backgroundColor: "rgba(0,196,140,0.07)",
      borderWidth: 1,
      borderColor: "rgba(0,196,140,0.4)",
    },
    expenseCard: {
      marginLeft: 8,
      backgroundColor: "rgba(26,115,232,0.06)",
      borderWidth: 1,
      borderColor: "rgba(26,115,232,0.35)",
    },
    balanceCard: {
      marginTop: 6,
      backgroundColor: "rgba(255,199,39,0.13)",
      borderWidth: 1,
      borderColor: "rgba(255,199,39,0.7)",
    },
    metricLabel: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginBottom: 2,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: "700",
      color: COLORS.text,
    },

    transactionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.border,
    },
    transactionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.text,
    },
    transactionDate: {
      marginTop: 2,
      fontSize: 12,
      color: COLORS.textMuted,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: "700",
    },
    amountIncome: {
      color: COLORS.accentGreen,
    },
    amountExpense: {
      color: "#FF5B5B",
    },
    emptyText: {
      marginTop: 4,
      fontSize: 13,
      color: COLORS.textMuted,
    },

    linkText: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.accentBlue,
    },
    statsSummaryText: {
      fontSize: 13,
      color: COLORS.textMuted,
      marginBottom: 12,
    },
    progressBarBackground: {
      height: 10,
      borderRadius: 8,
      backgroundColor: COLORS.border,
      overflow: "hidden",
      marginBottom: 12,
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: COLORS.accentGreen,
      borderRadius: 8,
    },
    statsFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statsPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.03)",
    },
    statsDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statsPillText: {
      fontSize: 12,
      color: COLORS.text,
    },

    fab: {
      position: "absolute",
      right: 24,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.accentBlue,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    fabText: {
      fontSize: 28,
      color: "#fff",
      fontWeight: "700",
      marginTop: -2,
    },
  });