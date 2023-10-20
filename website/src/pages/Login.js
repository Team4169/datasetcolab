import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate("/");
      setErrors([]);
    } catch (error) {
      let errorMessage = "";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "User not found. Please check your email and try again.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email format. Please provide a valid email address.";
          break;
        default:
          errorMessage = "Failed to log in. Please try again.";
          break;
      }
      setErrors([...errors, errorMessage]);
    }

    setLoading(false);
  }

  function handleDismiss(index) {
    const updatedErrors = errors.filter((_, i) => i !== index);
    setErrors(updatedErrors);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Login</h2>
      {errors.map((error, index) => (
        <Alert key={index} variant="danger" onClose={() => handleDismiss(index)} dismissible>
          {error}
        </Alert>
      ))}
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
          Login
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
