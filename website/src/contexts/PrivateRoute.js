import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  console.log(currentUser);
  if (currentUser && currentUser.emailVerified) {
    return <Navigate to="/login" />;
  } else {
    return children;
  }
}