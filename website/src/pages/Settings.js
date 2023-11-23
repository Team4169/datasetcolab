import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import axios from "axios";

export default function Settings() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updatePassword_, updateEmail_, logout } = useAuth();
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [apiKey, setApiKey] = useState();

  let navigate = useNavigate();

  function handleProfile(e) {
    e.preventDefault();
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setError("Passwords do not match");
      return;
    }

    const promises = [];
    setLoadingProfile(true);
    setError("");

    if (emailRef.current.value !== currentUser.email) {
      promises.push(updateEmail_(emailRef.current.value));
    }
    if (passwordRef.current.value) {
      promises.push(updatePassword_(passwordRef.current.value));
    }

    Promise.all(promises)
      .then(() => {
        navigate("/");
      })
      .catch(() => {
        setError("Failed to update account");
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }

  const fetchApiKey = async () => {
    try {
      const idToken = await currentUser.getIdToken();

      let config = {
        headers: {
          idToken: idToken,
        },
      };

      const response = await axios.get("https://api.seanmabli.com:3433/apikey", config);

      setApiKey(response.data);
    } catch (err) {
      setError("Error API key.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Settings</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <h4>Profile</h4>
      <Form onSubmit={handleProfile}>
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
        <Button variant="primary" type="submit" disabled={loadingProfile} style={{ marginBottom: "20px" }}>
          Update
        </Button>
      </Form>
      <h4>API Key</h4>
      <h4>Delete Account</h4>
        <Button variant="danger" type="submit" style={{ marginBottom: "20px" }} onClick={() => navigate("/delete")}>
          Delete Account
        </Button>
    </div>
  );
}
