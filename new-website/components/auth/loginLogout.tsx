"use client"
import { auth } from "../../app/firebase/config";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'

import {LogoutUser} from "./logoutUser";
import {LoginButton} from "./loginButton";

export function LoginLogout() {
    const [user, setUser] = useState<any>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
	const router = useRouter()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (authUser) => {
			if (authUser) {
                setUser(authUser);
                setUserEmail(authUser.email);
              } else {
                setUser(null);
                setUserEmail(null);
              }
		})

		return () => unsubscribe()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

  return (
    <>
      {user ? (
      <LogoutUser />
      ) : (
      <LoginButton />
      )}
    </>
  );
  
}
