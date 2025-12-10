// app/(tabs)/budget.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useBudget, getMonthKey } from "../../context/BudgetContext";

const formatNumber = (n = 0) =>
  Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function BudgetScreen() {
  const { transactions } = useTransactions();
  const { colors } = useTheme();
  const { currency } = useCurrency();
  const { budgets, getBudgetForMonth, setMonthlyBudget } = useBudget();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const monthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentBudget = useMemo(
    () => getBudgetForMonth(monthKey),
    [getBudgetForMonth, monthKey]
  );

  const [input, setInput] = useState(
    currentBudget?.totalBudget ? String(currentBudget.totalBudget) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const spentThisMonth = useMemo(() => {
    let total = 0;
    transactions.forEach((t) => {
      const d = new Date(t.createdAt || t.date);
      if (Number.isNaN(d.getTime())) return;
      if (getMonthKey(d) === monthKey && t.amount < 0) {
        total += t.amount;
      }
    });
    return total; // negative
  }, [transactions, monthKey]);

  const spentAbs = Math.abs(spentThisMonth);
  const budgetValue = currentBudget?.totalBudget || 0;
  const remaining = budgetValue - spentAbs;
  const ratio =
    budgetValue > 0 ? Math.min(1, spentAbs / budgetValue) : 0;

  const handleSave = async () => {
    setError("");
    const value = parseFloat(input.replace(/,/g, "."));
    if (Number.isNaN(value) || value <= 0) {
      setError("Enter a valid budget amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      await setMonthlyBudget(monthKey, { totalBudget: value });
    } catch (e) {
      console.log("Budget save error", e);
      setError("Could not save budget. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // Build list of previous months with budgets
  const previousBudgets = useMemo(() => {
    const entries = Object.entries(budgets).filter(
      ([key]) => key !== monthKey
    );
    // sort newest first
    return entries.sort((a, b) => b[0].localeCompare(a[0]));
  }, [budgets, monthKey]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget plan</Text>
        <Text style={styles.headerSubtitle}>
          Start or adjust your monthly spending plan.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current month card */}
        <View style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>
            {monthKey} – current month
          </Text>

          {budgetValue ? (
            <>
              <Text style={styles.sectionSubtitle}>
                You have an active budget plan for this month.
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Budget</Text>
                <Text style={styles.value}>
                  {currency.symbol}
                  {formatNumber(budgetValue)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Spent so far</Text>
                <Text style={styles.value}>
                  {currency.symbol}
                  {formatNumber(spentAbs)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Remaining</Text>
                <Text
                  style={[
                    styles.value,
                    remaining < 0 && { color: colors.danger },
                  ]}
                >
                  {remaining >= 0 ? "" : "-"}
                  {currency.symbol}
                  {formatNumber(Math.abs(remaining))}
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
              <Text style={styles.progressText}>
                {budgetValue > 0
                  ? `${Math.round(ratio * 100)}% of budget used`
                  : "No budget set."}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.sectionSubtitle}>
                You haven’t started a budget plan for this month yet.
              </Text>
            </>
          )}

          <Text style={[styles.label, { marginTop: 14 }]}>
            {budgetValue ? "Update budget" : "Start a new budget"}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder={`${currency.symbol} e.g. 200000`}
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : budgetValue ? "Update" : "Start"}
              </Text>
            </TouchableOpacity>
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>

        {/* Previous budgets */}
        {previousBudgets.length > 0 && (
          <View
            style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
          >
            <Text style={styles.sectionTitle}>Previous months</Text>
            {previousBudgets.map(([key, data]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{key}</Text>
                <Text style={styles.value}>
                  {currency.symbol}
                  {formatNumber(data.totalBudget || 0)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
      fontSize: 13,
      color: COLORS.textMuted,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      marginTop: 4,
    },
    label: {
      fontSize: 13,
      color: COLORS.textMuted,
    },
    value: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.text,
    },
    progressBarBackground: {
      marginTop: 10,
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
    progressText: {
      marginTop: 4,
      fontSize: 12,
      color: COLORS.textMuted,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      color: COLORS.text,
      backgroundColor: "#fff",
      marginRight: 8,
    },
    saveButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: COLORS.accentBlue,
    },
    saveButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
    },
    errorText: {
      marginTop: 4,
      fontSize: 12,
      color: COLORS.danger,
    },
  });