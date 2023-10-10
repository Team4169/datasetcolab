import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  console.log(currentUser);

  if (currentUser) {
    if (currentUser.emailVerified) {
      return children;
    } else {
      return <Navigate to="/email-verification" />;
    }
  } else {
    return <Navigate to="/login" />;
  }
}