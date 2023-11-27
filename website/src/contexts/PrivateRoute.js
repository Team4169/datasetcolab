import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children, noAuth }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    if (currentUser.emailVerified) {
      return children;
    } else {
      return <Navigate to="/email-verification" />;
    }
  } else {
    if (noAuth) {
      return noAuth;
    } else { 
      return <Navigate to="/" />;
    }
  }
}