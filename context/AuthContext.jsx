// context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,            // 👈 NEW
} from "firebase/auth";
import { auth } from "../firebaseConfig";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ?? null);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email.trim(), password);

  const logout = () => signOut(auth);

  const loginWithGoogleIdToken = async (idToken) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  };

  // 👇 NEW: send password reset email
  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loginWithGoogleIdToken,
      resetPassword,                 // 👈 EXPOSED
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}