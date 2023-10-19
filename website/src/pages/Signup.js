import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

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
      navigate("/email-verification");
    } catch {
      setError("Failed to create an account");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Sign Up</h2>
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
        <Form.Group controlId="passwordConfirm" style={{ marginBottom: "20px" }}>
          <Form.Label>Password Confirmation:</Form.Label>
          <Form.Control type="password" ref={passwordConfirmRef} required />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          Sign Up
        </Button>
      </Form>
      <div style={{ marginTop: "20px" }}>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
}
