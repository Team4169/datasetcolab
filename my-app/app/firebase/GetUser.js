"use client"
import {auth} from "./config";

import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

export function GetUser() {
	const [user, setUser] = useState<any>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
	const router = useRouter()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (authUser) => {
			if (user) {
                setUser(user);
                setUserEmail(user.email);
              } else {
                setUser(null);
                setUserEmail(null);
              }
		})

		return () => unsubscribe()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// useEffect(() => {
	// 	onAuthStateChanged(auth, (authUser) => {
	// 		if (user === undefined) return

	// 		// refresh when user changed to ease testing
	// 		if (user?.email !== authUser?.email) {
	// 			router.refresh()
	// 		}
	// 	})
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [user])

	return userEmail;
}