import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value);
      navigate("/");
    } catch {
      setError("Failed to create an account");
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
        <label>
          Password Confirmation:
          <input
            type="text"
            name="password"
            ref={passwordConfirmRef}
            required
          />
        </label>{" "}
        <br />
        <input type="submit" value="Sign Up" disabled={loading} />
      </form>
      <Link to="/login">Log In</Link>
    </>
  );
}