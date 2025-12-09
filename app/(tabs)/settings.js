// app/(tabs)/settings.js
import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Animated,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";

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

// Create styles from current theme colors
const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      paddingTop: 20,
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
      marginBottom: 10,
    },

    prefRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    prefIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(26,115,232,0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    prefLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: COLORS.text,
    },
    prefDescription: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginTop: 2,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: COLORS.border,
      marginVertical: 10,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    infoLabel: {
      fontSize: 13,
      color: COLORS.textMuted,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.text,
    },

    // Categories
    categoryList: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
      marginBottom: 10,
    },
    categoryChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.04)",
      marginRight: 8,
      marginBottom: 8,
    },
    categoryChipText: {
      fontSize: 12,
      color: COLORS.text,
    },
    addCategoryRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    categoryInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      color: COLORS.text,
      marginRight: 8,
      backgroundColor: "#fff",
    },
    addCategoryButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: COLORS.accentBlue,
    },
    addCategoryButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
    },

    dangerText: {
      marginTop: 6,
      fontSize: 13,
      color: COLORS.textMuted,
    },
    resetButton: {
      marginTop: 12,
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: COLORS.danger,
      flexDirection: "row",
      alignItems: "center",
    },
    resetButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
    },
  });

export default function SettingsScreen() {
  const {
    setTransactions,
    expenseCategories,
    incomeCategories,
    addCategory,
  } = useTransactions();
  const { isDark, colors, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [newExpenseName, setNewExpenseName] = useState("");
  const [newIncomeName, setNewIncomeName] = useState("");

  const handleResetData = () => {
    if (typeof setTransactions === "function") {
      setTransactions([]);
    }
  };

  const handleAddExpenseCategory = () => {
    const name = newExpenseName.trim();
    if (!name) return;
    addCategory("expense", name);
    setNewExpenseName("");
  };

  const handleAddIncomeCategory = () => {
    const name = newIncomeName.trim();
    if (!name) return;
    addCategory("income", name);
    setNewIncomeName("");
  };

  // Local component so it can use `styles`
  const PreferenceRow = ({
    icon,
    label,
    description,
    value,
    onValueChange,
  }) => (
    <View style={styles.prefRow}>
      <View style={styles.prefIconWrapper}>
        <Ionicons name={icon} size={18} color={colors.accentBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        {!!description && (
          <Text style={styles.prefDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: "rgba(0,0,0,0.15)",
          true: colors.accentBlue,
        }}
        thumbColor={value ? "#ffffff" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize how M‑Tracker works for you.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <FadeInSection delay={60} style={[styles.card, styles.shadowCard]}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <PreferenceRow
            icon="moon"
            label="Dark mode"
            description="Switch between light and dark theme."
            value={isDark}
            onValueChange={toggleTheme}
          />

          <View style={styles.divider} />

          <PreferenceRow
            icon="notifications"
            label="Daily summary"
            description="(Demo toggle – connect to real notifications later.)"
            value={true}
            onValueChange={() => {}}
          />
        </FadeInSection>

        {/* Expense categories */}
        <FadeInSection
          delay={120}
          style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
        >
          <Text style={styles.sectionTitle}>Expense categories</Text>
          <Text style={styles.prefDescription}>
            Used when you record expenses.
          </Text>

          <View style={styles.categoryList}>
            {expenseCategories.map((cat) => (
              <View key={cat.id} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.addCategoryRow}>
            <TextInput
              value={newExpenseName}
              onChangeText={setNewExpenseName}
              placeholder="New expense category"
              style={styles.categoryInput}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={handleAddExpenseCategory}
            >
              <Text style={styles.addCategoryButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </FadeInSection>

        {/* Income categories */}
        <FadeInSection
          delay={160}
          style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
        >
          <Text style={styles.sectionTitle}>Income categories</Text>
          <Text style={styles.prefDescription}>
            Used when you record income.
          </Text>

          <View style={styles.categoryList}>
            {incomeCategories.map((cat) => (
              <View key={cat.id} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.addCategoryRow}>
            <TextInput
              value={newIncomeName}
              onChangeText={setNewIncomeName}
              placeholder="New income category"
              style={styles.categoryInput}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={handleAddIncomeCategory}
            >
              <Text style={styles.addCategoryButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </FadeInSection>

        {/* General */}
        <FadeInSection
          delay={200}
          style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
        >
          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>₦ Nigerian Naira</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </FadeInSection>

        {/* Danger zone */}
        <FadeInSection
          delay={240}
          style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            Danger zone
          </Text>
          <Text style={styles.dangerText}>
            This will clear all your saved transactions from this device.
          </Text>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetData}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.resetButtonText}>Reset all data</Text>
          </TouchableOpacity>
        </FadeInSection>
      </ScrollView>
    </View>
  );
}