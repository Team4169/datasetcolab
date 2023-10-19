import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

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
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Log In</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="email" style={{ marginBottom: "20px" }}>
          <Form.Label>Email:</Form.Label>
          <Form.Control type="email" ref={emailRef} required />
        </Form.Group>
        <Form.Group controlId="password" style={{ marginBottom: "20px" }}>
          <Form.Label>Password:</Form.Label>
          <Form.Control type="password" ref={passwordRef} required />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          Log In
        </Button>
      </Form>
      <div style={{ marginTop: "20px" }}>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
      <div style={{ marginTop: "20px" }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
