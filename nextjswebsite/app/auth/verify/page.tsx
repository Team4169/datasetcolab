import React, { useState, useEffect } from "react";
import {useAuthState} from 'react-firebase-hooks/auth'
import { auth, app } from "../../firebase/config";
import { isSupported, getAnalytics } from "firebase/analytics";
//import { useNavigate, useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import { AlertCircle } from "lucide-react"


export default function EmailVerification() {
  const [user] = useAuthState(auth);
  const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
  const [error, setError] = useState("");
  let router = useRouter();


  useEffect(() => {
    const checkEmailVerified = async () => {
      if (user) {
        if (user.emailVerified) {
            router.push('/');
        } else {
          try {
            await user.reload();
          } catch (error) {
            setError("Failed to check email verification status.");
            //logEvent(analytics, "emailverification/error");
          }
        }
      }
    };
    const interval = setInterval(checkEmailVerified, 1000);
    return () => clearInterval(interval);
  }, [user, router]);


  return (
    <div style={{ padding: "20px" }}>
      {error && <Alert variant="destructive">{error}</Alert>}
      {user && !user.emailVerified && (
        <Alert variant="default">
        Email verification link sent to {user.email}
      </Alert>
      )}
    </div>
  );
}