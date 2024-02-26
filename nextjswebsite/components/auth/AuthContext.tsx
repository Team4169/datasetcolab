import React, { useContext, useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateEmail, updatePassword, sendEmailVerification, deleteUser, updateProfile } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/router";

interface AuthContextProps {
  currentUser: any;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateEmail_: (email: string) => Promise<void>;
  updatePassword_: (password: string) => Promise<void>;
  sendEmailVerification_: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function sendEmailVerification_() {
    return sendEmailVerification(auth.currentUser!);
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth).then(() => {
      router.push("/login"); // Redirect to login page after logout
    });
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  function updateEmail_(email: string) {
    return updateEmail(auth.currentUser!, email);
  }

  function updatePassword_(password: string) {
    return updatePassword(auth.currentUser!, password);
  }

  function updateUsername(username: string) {
    return updateProfile(auth.currentUser!, {
      displayName: username,
    });
  }
  
  function deleteAccount() {
    return deleteUser(auth.currentUser!);
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextProps = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail_,
    updatePassword_,
    sendEmailVerification_,
    updateUsername,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
