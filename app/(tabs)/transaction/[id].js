// app/(tabs)/transaction/[id].js
import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransactions } from "../../../context/TransactionContext";
import { useTheme } from "../../../context/ThemeContext";

const formatNumber = (n = 0) =>
  Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function FadeInCard({ delay = 0, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

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

export default function TransactionDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { transactions, deleteTransaction } = useTransactions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tx = transactions?.find((t) => String(t.id) === String(id));

  if (!tx) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={styles.missingText}>Transaction not found.</Text>
        <TouchableOpacity
          style={styles.backButtonAlt}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonAltText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isIncome = tx.amount > 0;
  const amountLabel = `${isIncome ? "+" : "-"}₦${formatNumber(
    Math.abs(tx.amount)
  )}`;

  const createdAt = tx.createdAt || tx.date;
  let dateLabel = "Unknown date";
  let timeLabel = "–";
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      dateLabel = d.toLocaleDateString();
      timeLabel = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const handleDelete = () => {
    deleteTransaction(tx.id);
    router.back();
  };

  const handleEdit = () => {
    // If your Add screen is at app/(tabs)/add.js, use "/(tabs)/add"
    router.push({ pathname: "/add", params: { editId: tx.id } });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Transaction details</Text>
      </View>

      {/* Amount banner */}
      <View
        style={[
          styles.amountBanner,
          {
            backgroundColor: isIncome ? colors.accentGreen : colors.danger,
          },
        ]}
      >
        <Text style={styles.amountLabel}>
          {isIncome ? "Income" : "Expense"}
        </Text>
        <Text style={styles.amountValue}>{amountLabel}</Text>
      </View>

      {/* Summary */}
      <FadeInCard delay={80} style={[styles.card, styles.shadowCard]}>
        <Text style={styles.sectionTitle}>Summary</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Category</Text>
          <Text style={styles.rowValue}>{tx.title}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Amount</Text>
          <Text style={styles.rowValue}>{amountLabel}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Type</Text>
          <Text style={styles.rowValue}>
            {tx.categoryType
              ? tx.categoryType === "income"
                ? "Income"
                : "Expense"
              : isIncome
              ? "Income"
              : "Expense"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Date</Text>
          <Text style={styles.rowValue}>{dateLabel}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Time</Text>
          <Text style={styles.rowValue}>{timeLabel}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>ID</Text>
          <Text style={styles.rowValue}>{tx.id}</Text>
        </View>
      </FadeInCard>

      {/* Description + Image */}
      {!!(tx.note || tx.imageUri) && (
        <FadeInCard
          delay={140}
          style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
        >
          <Text style={styles.sectionTitle}>Details</Text>

          {tx.note ? (
            <Text style={styles.noteText}>{tx.note}</Text>
          ) : (
            <Text style={styles.noteText}>No description</Text>
          )}

          {!!tx.imageUri && (
            <Image
              source={{ uri: tx.imageUri }}
              style={styles.detailsImage}
            />
          )}
        </FadeInCard>
      )}

      {/* Actions */}
      <FadeInCard
        delay={200}
        style={[styles.card, styles.shadowCard, { marginTop: 16 }]}
      >
        <Text style={styles.sectionTitle}>Actions</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionEdit]}
            onPress={handleEdit}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.actionText, { color: "#fff" }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionDelete]}
            onPress={handleDelete}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.actionText, { color: "#fff" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </FadeInCard>
    </View>
  );
}

/* Themed styles */

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: COLORS.card,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: COLORS.text,
    },

    amountBanner: {
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginBottom: 16,
    },
    amountLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.9)",
    },
    amountValue: {
      marginTop: 4,
      fontSize: 24,
      fontWeight: "800",
      color: "#fff",
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

    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    rowLabel: {
      fontSize: 13,
      color: COLORS.textMuted,
    },
    rowValue: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.text,
      marginLeft: 16,
      flexShrink: 1,
      textAlign: "right",
    },

    noteText: {
      fontSize: 14,
      color: COLORS.text,
    },
    detailsImage: {
      marginTop: 12,
      height: 180,
      borderRadius: 12,
      width: "100%",
      resizeMode: "cover",
    },

    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 999,
    },
    actionEdit: {
      marginRight: 6,
      backgroundColor: COLORS.accentBlue,
    },
    actionDelete: {
      marginLeft: 6,
      backgroundColor: COLORS.danger,
    },
    actionText: {
      fontSize: 13,
      fontWeight: "700",
    },

    missingText: {
      textAlign: "center",
      fontSize: 15,
      color: COLORS.text,
      marginBottom: 10,
    },
    backButtonAlt: {
      alignSelf: "center",
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: COLORS.accentBlue,
    },
    backButtonAltText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
    },
  });