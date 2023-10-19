import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import Button from 'react-bootstrap/Button';

export default function EmailVerification() {
  const { currentUser, sendEmailVerification_ } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await sendEmailVerification_();
      navigate("/email-verification");
    } catch {
      setError("Failed to resent verification email.");
    }

    setLoading(false);
  }

  if (currentUser) {
    if (!currentUser.emailVerified) {
      return (
        <>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <p>Email verification link sent to {currentUser.email}</p>
            <Button variant="primary" type="submit" disabled={loading}>
              Resend Email
            </Button>
          </form>
        </>
      );
    } else {
      return <Navigate to="/" />;
    }
  } else {
    return <Navigate to="/login" />;
  }
}
