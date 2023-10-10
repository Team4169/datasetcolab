import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom"

export default function EmailVerification() {
  const { currentUser } = useAuth();
  if (currentUser) {
    if (!currentUser.emailVerified) {
        return (
          <>
            <p>Email verification link sent to {currentUser.email}</p>
          </>
        );
    } else {
        return <Navigate to="/" />;
    }
  } else {
    return <Navigate to="/login" />;
  }
}