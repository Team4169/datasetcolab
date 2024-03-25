"use client";
import { auth } from "../../app/firebase/config";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { LogoutUser } from "./logoutUser";
import { LoginButton } from "./loginButton";

export function LoginLogout() {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        setUserEmail(authUser.email);
      } else {
        setUser(null);
        setUserEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{user ? <LogoutUser /> : <LoginButton />}</>;
}
