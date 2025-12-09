// app/(tabs)/add.js
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useTransactions } from "../../context/TransactionContext";
import { useTheme } from "../../context/ThemeContext";

/* ---------- Animation wrapper ---------- */

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

/* ---------- Header ---------- */

function HeaderSection({ onClose, styles, colors, isEditing }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={onClose}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit transaction" : "Add transaction"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isEditing
            ? "Update the details of this transaction."
            : "Record a new income or expense to keep your balance up to date."}
        </Text>
      </View>
    </View>
  );
}

/* ---------- Type toggle ---------- */

function TypeToggle({ type, setType, styles }) {
  return (
    <View style={styles.typeToggle}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          type === "expense" && styles.typeButtonActiveExpense,
        ]}
        onPress={() => setType("expense")}
      >
        <Text
          style={[
            styles.typeButtonText,
            type === "expense" && styles.typeButtonTextActive,
          ]}
        >
          Expense
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeButton,
          type === "income" && styles.typeButtonActiveIncome,
        ]}
        onPress={() => setType("income")}
      >
        <Text
          style={[
            styles.typeButtonText,
            type === "income" && styles.typeButtonTextActive,
          ]}
        >
          Income
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Category selector ---------- */

function CategorySelector({
  categories = [],
  selectedId,
  onSelect,
  onManagePress,
  styles,
}) {
  if (!categories.length) {
    return (
      <View style={{ marginTop: 4 }}>
        <Text style={styles.emptyCategoriesText}>
          No categories yet. Add some in Settings.
        </Text>
        <TouchableOpacity
          style={[styles.categoryChip, styles.categoryChipManage]}
          onPress={onManagePress}
        >
          <Text style={styles.categoryChipManageText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      {categories.map((cat) => {
        const isActive = cat.id === selectedId;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              isActive && styles.categoryChipActive,
            ]}
            onPress={() => onSelect(cat.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                isActive && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.categoryChip, styles.categoryChipManage]}
        onPress={onManagePress}
      >
        <Text style={styles.categoryChipManageText}>+ Manage</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- Screen ---------- */

export default function AddTransactionScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams(); // ?editId=...
  const {
    transactions,
    addTransaction,
    updateTransaction,
    expenseCategories = [],
    incomeCategories = [],
  } = useTransactions();

  const isEditing = !!editId;
  const existingTx = useMemo(
    () =>
      isEditing
        ? transactions.find((t) => String(t.id) === String(editId))
        : null,
    [isEditing, editId, transactions]
  );

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [type, setType] = useState(
    existingTx
      ? existingTx.categoryType || (existingTx.amount < 0 ? "expense" : "income")
      : "expense"
  );
  const [amountInput, setAmountInput] = useState(
    existingTx ? Math.abs(existingTx.amount).toString() : ""
  );
  const [note, setNote] = useState(existingTx?.note || "");
  const [imageUri, setImageUri] = useState(existingTx?.imageUri || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    existingTx?.categoryId || null
  );
  const [error, setError] = useState("");

  // Categories for current type
  const activeCategories =
    type === "expense" ? expenseCategories : incomeCategories;

  // When editing and tx becomes available, ensure local state is filled
  useEffect(() => {
    if (!isEditing || !existingTx) return;
    setType(
      existingTx.categoryType ||
        (existingTx.amount < 0 ? "expense" : "income")
    );
    setAmountInput(Math.abs(existingTx.amount).toString());
    setNote(existingTx.note || "");
    setImageUri(existingTx.imageUri || null);
    setSelectedCategoryId(
      existingTx.categoryId || activeCategories[0]?.id || null
    );
  }, [isEditing, existingTx]);

  // Ensure there is always a selected category when ADDING new (not editing)
  useEffect(() => {
    if (isEditing) return;
    if (
      !selectedCategoryId ||
      !activeCategories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(activeCategories[0]?.id ?? null);
    }
  }, [isEditing, type, expenseCategories, incomeCategories, activeCategories]);

  const openCategorySettings = () => {
    router.push("/(tabs)/settings");
  };

  const pickImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission is required to choose a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Clear fields after saving a NEW transaction
  const resetForm = () => {
    setType("expense");
    setAmountInput("");
    setNote("");
    setImageUri(null);
    setSelectedCategoryId(expenseCategories[0]?.id ?? null);
    setError("");
  };

  const handleSubmit = () => {
    setError("");

    const parsed = parseFloat(amountInput.replace(/,/g, "."));

    if (!selectedCategoryId) {
      setError("Please choose a category.");
      return;
    }

    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    const signedAmount =
      type === "expense" ? -Math.abs(parsed) : Math.abs(parsed);

    const categoryObj = activeCategories.find(
      (c) => c.id === selectedCategoryId
    );
    const categoryName = categoryObj ? categoryObj.label : "Uncategorized";

    const now = new Date();
    const baseFields = {
      title: categoryName,
      categoryId: selectedCategoryId,
      categoryType: type,
      amount: signedAmount,
      note: note.trim() || undefined,
      imageUri: imageUri || undefined,
    };

    if (isEditing && existingTx) {
      // EDIT: update then go back
      updateTransaction(existingTx.id, {
        ...baseFields,
        createdAt: existingTx.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      });
      router.back();
    } else {
      // NEW: add and clear form, stay on screen
      const newTx = {
        id: Date.now().toString(),
        ...baseFields,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      addTransaction(newTx);
      resetForm();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <HeaderSection
        onClose={() => router.back()}
        styles={styles}
        colors={colors}
        isEditing={isEditing}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInSection delay={60}>
          <TypeToggle type={type} setType={setType} styles={styles} />
        </FadeInSection>

        <FadeInSection delay={120} style={styles.card}>
          <Text style={styles.label}>
            {type === "expense" ? "Expense category" : "Income category"}
          </Text>
          <CategorySelector
            categories={activeCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onManagePress={openCategorySettings}
            styles={styles}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Amount (₦)</Text>
          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="e.g. 5000"
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>
            Description (optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Short description"
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholderTextColor={colors.textMuted}
            multiline
          />

          {/* Photo */}
          <Text style={[styles.label, { marginTop: 18 }]}>
            Photo (optional)
          </Text>
          <View style={styles.photoRow}>
            {imageUri ? (
              <>
                <TouchableOpacity
                  style={styles.photoPreviewWrapper}
                  onPress={pickImage}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.photoPreview}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setImageUri(null)}>
                  <Text style={styles.clearPhotoText}>Remove</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.photoAddButton}
                onPress={pickImage}
              >
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={colors.accentBlue}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.photoAddText}>Add photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </FadeInSection>

        <FadeInSection delay={180} style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSubmit}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.buttonText}>
              {isEditing ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        </FadeInSection>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------- Themed styles ---------- */

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingTop: 18,
      paddingBottom: 10,
      paddingHorizontal: 18,
      backgroundColor: COLORS.primary,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.7)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 4,
    },
    headerTextContainer: { flex: 1 },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: COLORS.text,
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: COLORS.text,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 26,
    },

    typeToggle: {
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.05)",
      borderRadius: 999,
      padding: 4,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    typeButtonActiveExpense: {
      backgroundColor: "rgba(255,91,91,0.2)",
    },
    typeButtonActiveIncome: {
      backgroundColor: "rgba(0,196,140,0.2)",
    },
    typeButtonText: {
      fontSize: 14,
      color: COLORS.textMuted,
      fontWeight: "500",
    },
    typeButtonTextActive: {
      color: COLORS.text,
      fontWeight: "700",
    },

    card: {
      marginTop: 16,
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.text,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.border || "rgba(0,0,0,0.07)",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: COLORS.text,
      backgroundColor: "#fff",
    },

    categoryScroll: {
      paddingVertical: 4,
      paddingRight: 4,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.04)",
      marginRight: 8,
    },
    categoryChipActive: {
      backgroundColor: COLORS.accentBlue,
    },
    categoryChipText: {
      fontSize: 13,
      color: COLORS.textMuted,
    },
    categoryChipTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    categoryChipManage: {
      borderWidth: 1,
      borderColor: COLORS.accentBlue,
      backgroundColor: "transparent",
    },
    categoryChipManageText: {
      fontSize: 13,
      color: COLORS.accentBlue,
      fontWeight: "600",
    },
    emptyCategoriesText: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginBottom: 6,
    },

    photoRow: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
    },
    photoPreviewWrapper: {
      width: 70,
      height: 70,
      borderRadius: 12,
      overflow: "hidden",
      marginRight: 12,
    },
    photoPreview: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    photoAddButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: COLORS.accentBlue,
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    photoAddText: {
      fontSize: 13,
      color: COLORS.accentBlue,
      fontWeight: "600",
    },
    clearPhotoText: {
      fontSize: 12,
      color: COLORS.textMuted,
    },

    errorText: {
      marginTop: 10,
      fontSize: 12,
      color: COLORS.danger,
    },

    footer: {
      marginTop: 18,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    buttonPrimary: {
      marginLeft: 8,
      backgroundColor: COLORS.accentBlue,
    },
    buttonSecondary: {
      marginRight: 8,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
  });