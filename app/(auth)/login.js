// app/(auth)/login.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

// Map Firebase error codes to friendly messages
function getAuthErrorMessage(error, mode) {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/user-not-found":
      return mode === "reset"
        ? "No account exists with this email."
        : "Incorrect email or password.";

    case "auth/wrong-password":
      return "Incorrect email or password.";

    case "auth/email-already-in-use":
      return mode === "register"
        ? "This email is already registered. Try logging in instead."
        : "This email is already in use.";

    case "auth/weak-password":
      return "Password should be at least 6 characters.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    default:
      return "Something went wrong. Please try again.";
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, loginWithGoogleIdToken, resetPassword } = useAuth();
  const { colors } = useTheme();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");      // 👈 success / info messages

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  });

  // Google sign-in → Firebase
  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type !== "success") return;
      const { id_token } = response.params;

      try {
        await loginWithGoogleIdToken(id_token);
        router.replace("/(tabs)");
      } catch (e) {
        console.log("Google sign-in error", e);
        setInfo("");
        setErr(getAuthErrorMessage(e, "login"));
      }
    };

    signInWithGoogle();
  }, [response, loginWithGoogleIdToken, router]);

  const handleEmailSubmit = async () => {
    setErr("");
    setInfo("");
    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password) {
        setErr("Enter email and password.");
        return;
      }

      if (mode === "login") {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password);
      }

      router.replace("/(tabs)");
    } catch (e) {
      console.log("Email auth error", e);
      setInfo("");
      setErr(getAuthErrorMessage(e, mode));
    }
  };

  const handleGooglePress = async () => {
    setErr("");
    setInfo("");
    try {
      await promptAsync();
    } catch (e) {
      console.log("Google prompt error", e);
      setErr("Could not start Google sign‑in. Please try again.");
    }
  };

  // 👇 Forgot password handler
  const handleForgotPassword = async () => {
    setErr("");
    setInfo("");
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErr("Enter your email above, then tap 'Forgot password?'.");
      return;
    }

    try {
      await resetPassword(trimmedEmail);
      setInfo("Password reset link sent to your email.");
    } catch (e) {
      console.log("Reset password error", e);
      setErr(getAuthErrorMessage(e, "reset"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>M‑Tracker</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {mode === "login"
          ? "Sign in to see your expenses and income."
          : "Create an account to save your data."}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textMuted}
        />

        {/* Forgot password link (only in login mode) */}
        {mode === "login" && (
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {err ? <Text style={styles.error}>{err}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleEmailSubmit}
        >
          <Text style={styles.buttonPrimaryText}>
            {mode === "login" ? "Login" : "Register"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.buttonGoogle}
          onPress={handleGooglePress}
          disabled={!request}
        >
          <Ionicons
            name="logo-google"
            size={18}
            color="#4285F4"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonGoogleText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 12 }}
          onPress={() => {
            setErr("");
            setInfo("");
            setMode((m) => (m === "login" ? "register" : "login"));
          }}
        >
          <Text style={{ color: "#1A73E8", fontSize: 13 }}>
            {mode === "login"
              ? "No account? Register"
              : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 6, textAlign: "center" },
  card: {
    width: "100%",
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 12,
    color: "#1A73E8",
    fontWeight: "600",
  },
  error: { color: "red", fontSize: 12, marginBottom: 4 },
  info: { color: "green", fontSize: 12, marginBottom: 4 },
  buttonPrimary: {
    marginTop: 8,
    backgroundColor: "#1A73E8",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonPrimaryText: { color: "#fff", fontWeight: "700" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#7f8c8d",
  },
  buttonGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "#fff",
  },
  buttonGoogleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
});