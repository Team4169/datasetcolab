import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Alert from "react-bootstrap/Alert";

export default function EmailVerification() {
  const { currentUser } = useAuth();
  const [error, setError] = useState("");
  let navigate = useNavigate();

  useEffect(() => {
    const checkEmailVerified = async () => {
      if (currentUser) {
        if (currentUser.emailVerified) {
          navigate(destination);
        } else {
          try {
            await currentUser.reload();
          } catch (error) {
            setError("Failed to check email verification status.");
          }
        }
      }
    };
    const interval = setInterval(checkEmailVerified, 1000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  const location = useLocation();
  const [destination, setDestination] = useState("/");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("to") != null) {
      setDestination("/" + searchParams.get("to"));
    }
  }, [location.search]);

  return (
    <div style={{ padding: "20px" }}>
      {error && <Alert variant="danger">{error}</Alert>}
      {currentUser && !currentUser.emailVerified && (
        <>
          <Alert variant="info">
            Email verification link sent to {currentUser.email}
          </Alert>
        </>
      )}
    </div>
  );
}
