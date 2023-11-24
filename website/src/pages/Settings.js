import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import axios from "axios";

const styles = {
  padding: "20px",
  downloadContainer: { maxWidth: "800px", margin: "0 auto" },
  datasetCard: { marginBottom: "20px", border: "1px solid #e9ecef" },
  optionsContainer: {
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  downloadMethodContainer: { display: "flex", gap: "10px" },
  downloadButtonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px",
    border: "none",
    padding: "0",
  },
  codeBlock: {
    backgroundColor: "#e9ecef",
    padding: "10px",
    borderRadius: "5px",
    overflow: "auto",
    position: "relative",
    marginBottom: "5px",
  },
  copyButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    cursor: "pointer",
  },
  alertContainer: {
    position: "fixed",
    bottom: "10px",
    left: "10px",
    zIndex: 999,
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  closeButton: { cursor: "pointer" },
  checkboxGroup: { display: "flex", gap: "10px", flexWrap: "wrap" },
};

export default function Settings() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updatePassword_, updateEmail_, logout } = useAuth();
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [apiKey, setApiKey] = useState("API_KEY");
  const [showCopyAlert, setShowCopyAlert] = useState(false);

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

      const response = await axios.get("https://api.seanmabli.com:3433/getApiKey", config);
      setApiKey(response.data);

    } catch (err) {
      setError("Error API key.");
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setShowCopyAlert(true);
  };

  useEffect(() => {
    const alertTimeout = setTimeout(() => setShowCopyAlert(false), 5000);
    return () => clearTimeout(alertTimeout);
  }, [showCopyAlert]);

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
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <div  style={{ ...styles.codeBlock, width: "100%" }}>
          <code>{apiKey}</code>
          <div
            style={styles.copyButton}
            onClick={handleCopyToClipboard}
          >
            <span role="img" aria-label="Copy">
              📋
            </span>
          </div>
        </div>
        <Button variant="primary" type="submit" style={{ marginLeft: "10px", minWidth: "120px"}}>
          New API Key
        </Button>
      </div>
      <h4>Delete Account</h4>
      <Button variant="danger" type="submit" style={{ marginBottom: "20px" }} onClick={() => navigate("/delete")}>
        Delete Account
      </Button>
      {showCopyAlert && (
        <Alert variant="success" style={styles.alertContainer} dismissible>
          API Key copied to clipboard
        </Alert>
      )}
    </div>
  );
}
