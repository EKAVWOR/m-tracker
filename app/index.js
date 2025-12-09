// app/index.js
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import Logo from "../assets/images/m-tracker-logo.png"; // update if needed

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image source={Logo} style={styles.logo} />
      </View>

      <Text style={styles.appName}>M- Tracker</Text>
      <Text style={styles.tagline}>
        Track your money, stay in control.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    logoCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "white",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
    },
    logo: {
      width: 110,
      height: 110,
      resizeMode: "contain",
    },
    appName: {
      fontSize: 32,
      fontWeight: "800",
      color: COLORS.text,
    },
    tagline: {
      marginTop: 10,
      fontSize: 16,
      color: COLORS.textMuted,
      textAlign: "center",
    },
    button: {
      marginTop: 40,
      backgroundColor: COLORS.accentBlue,
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 25,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });