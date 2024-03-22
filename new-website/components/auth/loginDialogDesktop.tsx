"use client";
import { useState } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../../app/firebase/config";
import { useRouter } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {  GithubAuthProvider, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Icons } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginDialogDesktop() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword] =
    useCreateUserWithEmailAndPassword(auth);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      const res = await signInWithEmailAndPassword(email, password);
      console.log({ res });
      sessionStorage.setItem("user", "true");
      setEmail("");
      setPassword("");
      router.push("/");
      setError("");
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleSignInWithGoogle = async () => {

    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log({ user });
        sessionStorage.setItem("user", "true");
        setEmail("");
        setPassword("");
        router.push("/");
        setError("");
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);

        console.error(error);
        setError(error.message);
        // ...
      });
}

const handleSignInWithGithub = async () => {
  const provider = new GithubAuthProvider();
  signInWithPopup(auth, provider)
  .then((result) => {
    // This gives you a GitHub Access Token. You can use it to access the GitHub API.
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    // The signed-in user info.
    const user = result.user;
    console.log({ user });
    sessionStorage.setItem("user", "true");
    setEmail("");
    setPassword("");
    router.push("/");
    setError("");
    // IdP data available using getAdditionalUserInfo(result)
    // ...
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GithubAuthProvider.credentialFromError(error);
    console.error(error);
    setError(error.message);
    // ...
  });
}

  return (
    <Dialog>
      <DialogTrigger asChild>
        <a
          href="#"
          className="text-gray-300 hover:bg-gray-200 hover:text-gray-800 rounded-md px-3 py-2 text-sm font-medium"
        >
          Login
        </a>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-6">
            <Button variant="outline" onClick={handleSignInWithGithub}>
              <Icons.gitHub className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline" onClick={handleSignInWithGoogle}>
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="col-span-1 text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              className="col-span-3"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="col-span-1 text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="col-span-3"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex flex-col items-center">
            <Button type="submit" onClick={handleSignIn}>
              Submit
            </Button>
            <div className="mt-4 text-gray-500 text-sm">
              <span>Don&apos;t have an account? </span>
              <Link legacyBehavior href="/auth/signup">
                <a className="text-gray-500 hover:text-indigo-600">Sign Up</a>
              </Link>
            </div>
            <div className="mt-2 text-gray-500 text-sm">
              <span>Forgot your password? </span>
              <Link legacyBehavior href="/auth/reset">
                <a className="text-gray-500 hover:text-indigo-600">
                  Reset Password
                </a>
              </Link>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}