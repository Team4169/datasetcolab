'use client'
import { useState } from 'react';
import {useSignInWithEmailAndPassword, useCreateUserWithEmailAndPassword, useSendPasswordResetEmail} from 'react-firebase-hooks/auth'
import {auth} from '../../firebase/config'
import { useRouter } from 'next/navigation';
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export default function AuthenticationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth);
  const [error, setError] = useState("");
  const [sendPasswordResetEmail] = useSendPasswordResetEmail(auth);
  const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-3xl font-bold mb-4">Reset Password</h1>
          <input
            type="email"
            placeholder="Email"
            className="w-64 px-4 py-2 mb-2 border border-gray-300 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="w-64 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => {
              sendPasswordResetEmail(email)
                .then(() => {
                  // Password reset email sent successfully
                  router.push("/auth/reset/success");
                })
                .catch((error) => {
                  // Handle error
                  const errorCode = error.code;
                  const errorMessage = error.message;
                  setError(errorMessage);
                });
            }}
          >
            Send Reset Email
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <Link legacyBehavior href="/auth/login">
            <a className="text-blue-500 mt-4">Back to Login</a>
          </Link>
        </div>
    );

};
