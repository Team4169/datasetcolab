import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import axios from "axios";

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, sendEmailVerification_ } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const currentUser = (await signup(emailRef.current.value, passwordRef.current.value)).user;
      console.log(currentUser);
      const idToken = await currentUser.getIdToken();
      let config = {
        headers: {
          idToken: idToken,
        },
      };
      await axios.get("https://api.seanmabli.com:3433/newapikey", config);
      await sendEmailVerification_();
      navigate("/email-verification?to=" + destination);
    } catch {
      setError("Failed to create an account");
    }

    setLoading(false);
  }

  const location = useLocation();
  const [destination, setDestination] = useState("/"); 

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("to") != null) {
      setDestination(searchParams.get("to"));
    }
  }, [location.search]);

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Sign Up</h2>
      {error && <Alert variant="danger">{error}</Alert>}
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
