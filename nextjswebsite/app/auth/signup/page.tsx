'use client'
import { useState } from 'react';
import {useSignInWithEmailAndPassword} from 'react-firebase-hooks/auth'
import {useCreateUserWithEmailAndPassword} from 'react-firebase-hooks/auth'
import {useUpdateProfile} from 'react-firebase-hooks/auth'
import {auth} from '../../firebase/config'
import { useRouter } from 'next/navigation';
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";




export default function AuthenticationPage() {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth);
  const [error, setError] = useState("");
  const router = useRouter()

  const handleSignUp = async () => {
    try {
        const res = await createUserWithEmailAndPassword(email, password)
        console.log({res})
        sessionStorage.setItem('user', "true")
        setEmail('');
        setPassword('');

    } catch(e){
        console.error(e);
        setError(e.message);
    }
  };


  return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-md">
            <h2 className="text-2xl font-bold text-center">Sign Up</h2>
            <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        User Name
                    </label>
                    <div className="mt-1">
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
    </div>
);
}
