'use client'
import { useState } from 'react';
import {useSignInWithEmailAndPassword} from 'react-firebase-hooks/auth'
import {useCreateUserWithEmailAndPassword} from 'react-firebase-hooks/auth'
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
  const router = useRouter()

  const handleSignIn = async () => {
    try {
        const res = await signInWithEmailAndPassword(email, password);
        console.log({res});
        sessionStorage.setItem('user', "true")
        setEmail('');
        setPassword('');
        router.push('/');
        setError("");
    }catch(e){
        console.error(e)
        setError(e.message)
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-md">
        <h2 className="text-2xl font-bold mb-6">Sign In</h2>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="button"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleSignIn}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
      <div className="mt-4 text-gray-600">
        Don't have an account?{" "}
        <Link legacyBehavior href="/auth/signup">
          <a className="text-indigo-600 hover:text-indigo-700">Sign Up</a>
        </Link>
        <br />
        Forgot your password?{" "}
        <Link legacyBehavior href="/auth/reset">
          <a className="text-indigo-600 hover:text-indigo-700">Reset Password</a>
        </Link>
      </div>
    </div>
  );
}
