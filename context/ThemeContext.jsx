// context/ThemeContext.js
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Appearance } from "react-native";

const LIGHT_COLORS = {
  primary: "#FFC727",
  background: "#FFF9E9",
  card: "#FFFFFF",
  accentBlue: "#1A73E8",
  accentGreen: "#00C48C",
  text: "#1E272E",
  textMuted: "#8395A7",
  border: "rgba(0,0,0,0.08)",
  danger: "#FF5B5B",
};

const DARK_COLORS = {
  primary: "#FFC727",
  background: "#05070A",
  card: "#151820",
  accentBlue: "#4C8DFF",
  accentGreen: "#00D59C",
  text: "#F5F6FA",
  textMuted: "#8C9AAE",
  border: "rgba(255,255,255,0.12)",
  danger: "#FF6B81",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(
    Appearance.getColorScheme() === "dark"
  );

  // (Optional) follow system theme changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === "dark");
    });
    return () => sub.remove();
  }, []);

  const colors = useMemo(
    () => (isDark ? DARK_COLORS : LIGHT_COLORS),
    [isDark]
  );

  const value = useMemo(
    () => ({
      isDark,
      colors,
      toggleTheme: () => setIsDark((prev) => !prev),
    }),
    [isDark, colors]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}