"use client";
import { useState } from "react";
import { useSendPasswordResetEmail } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthenticationPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sendPasswordResetEmail] = useSendPasswordResetEmail(auth);
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email below to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => {
              sendPasswordResetEmail(email)
                .then(() => {
                  // Password reset email sent successfully
                  router.push("/");
                })
                .catch((error) => {
                  // Handle error
                  const errorMessage = error.message;
                  setError(errorMessage);
                });
            }}
          >
            Send Reset Email
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
/*
<Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email below to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => {
        sendPasswordResetEmail(email)
          .then(() => {
            // Password reset email sent successfully
            router.push("/");
          })
          .catch((error) => {
            // Handle error
            const errorMessage = error.message;
            setError(errorMessage);
          });
      }}>
            Send Reset Email
          </Button>
        </CardFooter>
      </Card>

*/
