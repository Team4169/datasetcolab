import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate("/");
    } catch {
      setError("Failed to log in");
    }

    setLoading(false);
  }

  return (
    <>
      {error && alert(error)}
      <form onSubmit={handleSubmit}>
        <label>
          Email:
          <input type="text" name="email" ref={emailRef} required />
        </label>{" "}
        <br />
        <label>
          Password:
          <input type="text" name="password" ref={passwordRef} required />
        </label>{" "}
        <br />
        <input type="submit" value="Log In" disabled={loading} />
      </form>
      <Link to="/forgot-password">Forgot Password?</Link> <br />
      <Link to="/signup">Sign Up</Link>
    </>
  );
}