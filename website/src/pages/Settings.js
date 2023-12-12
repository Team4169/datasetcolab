import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
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
  const emailConfirmRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updateEmail_, updatePassword_ } = useAuth();
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [apiKeyError, setApiKeyError] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingNewApiKey, setLoadingNewApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("API_KEY");
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [updateEmailSuccess, setUpdateEmailSuccess] = useState(false);
  const [updatePasswordSuccess, setUpdatePasswordSuccess] = useState(false);

  let navigate = useNavigate();

  const handleUpdate = async (
    type,
    ref,
    confirmRef,
    updateFunction,
    setLoading,
    setError,
    setSuccess
  ) => {
    setLoading(true);
    setError(null);

    if (ref.current.value !== confirmRef.current.value) {
      setError(`${type}s do not match`);
      setLoading(false);
      return;
    }

    const promises = [];
    if (ref.current.value && ref.current.value !== currentUser.email) {
      promises.push(updateFunction(ref.current.value));
    }

    Promise.all(promises)
      .then(() => {
        setSuccess(true);
        ref.current.value = "";
        confirmRef.current.value = "";
      })
      .catch(() => setError(`Failed to update ${type.toLowerCase()}`))
      .finally(() => setLoading(false));
  };

  const handleEmail = (e) => {
    e.preventDefault();
    handleUpdate(
      "Email",
      emailRef,
      emailConfirmRef,
      updateEmail_,
      setLoadingEmail,
      setEmailError,
      setUpdateEmailSuccess
    );
  };

  const handlePassword = (e) => {
    e.preventDefault();
    handleUpdate(
      "Password",
      passwordRef,
      passwordConfirmRef,
      updatePassword_,
      setLoadingPassword,
      setPasswordError,
      setUpdatePasswordSuccess
    );
  };

  const fetchApiKey = async (isNew) => {
    try {
      const setLoading = isNew ? setLoadingNewApiKey : () => {};
      setLoading(true);

      const idToken = await currentUser.getIdToken();

      let config = {
        headers: {
          idToken: idToken,
          new: isNew ? "true" : "false",
        },
      };

      const response = await axios.get(
        "https://api.datasetcolab.com/api",
        config
      );
      setApiKey(response.data);
      setShowCopyAlert(false);
    } catch (err) {
      setApiKeyError(
        isNew ? "Error generating a new API key." : "Error fetching API key."
      );
    } finally {
      setLoadingNewApiKey(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setShowCopyAlert(true);
  };

  useEffect(() => {
    fetchApiKey(false);

    const alertTimeout = setTimeout(() => setShowCopyAlert(false), 5000);
    return () => clearTimeout(alertTimeout);
  }, [currentUser]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Settings</h2>
      {/*
      {emailError && (
        <Alert variant="danger" onClose={() => setEmailError(null)} dismissible>
          {emailError}
        </Alert>
      )}
      {updateEmailSuccess && (
        <Alert
          variant="success"
          onClose={() => setUpdateEmailSuccess(false)}
          dismissible
        >
          Email updated successfully
        </Alert>
      )}
      <h4>Update Email</h4>
      <Form onSubmit={handleEmail}>
        <Form.Group controlId="email" style={{ marginBottom: "20px" }}>
          <Form.Label>Email:</Form.Label>
          <Form.Control type="email" ref={emailRef} required />
        </Form.Group>
        <Form.Group controlId="emailConfirm" style={{ marginBottom: "20px" }}>
          <Form.Label>Email Confirmation:</Form.Label>
          <Form.Control type="email" ref={emailConfirmRef} required />
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
          disabled={loadingEmail}
          style={{ marginBottom: "20px" }}
        >
          Update Email
        </Button>
      </Form>
      {passwordError && (
        <Alert
          variant="danger"
          onClose={() => setPasswordError(null)}
          dismissible
        >
          {passwordError}
        </Alert>
      )}
      {updatePasswordSuccess && (
        <Alert
          variant="success"
          onClose={() => setUpdatePasswordSuccess(false)}
          dismissible
        >
          Password updated successfully
        </Alert>
      )}
      */}
      <h4>Update Password</h4>
      <Form onSubmit={handlePassword}>
        <Form.Group controlId="password" style={{ marginBottom: "20px" }}>
          <Form.Label>Password:</Form.Label>
          <Form.Control type="password" ref={passwordRef} required />
        </Form.Group>
        <Form.Group
          controlId="passwordConfirm"
          style={{ marginBottom: "20px" }}
        >
          <Form.Label>Password Confirmation:</Form.Label>
          <Form.Control type="password" ref={passwordConfirmRef} required />
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
          disabled={loadingPassword}
          style={{ marginBottom: "20px" }}
        >
          Update Password
        </Button>
      </Form>
      {apiKeyError && (
        <Alert
          variant="danger"
          onClose={() => setApiKeyError(null)}
          dismissible
        >
          {apiKeyError}
        </Alert>
      )}
      <h4>API Key</h4>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
      >
        <div style={{ ...styles.codeBlock, width: "100%" }}>
          <code>{apiKey}</code>
          <div style={styles.copyButton} onClick={handleCopyToClipboard}>
            <span role="img" aria-label="Copy">
              📋
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          type="submit"
          onClick={() => fetchApiKey(true)}
          style={{ marginLeft: "10px", minWidth: "120px" }}
          disabled={loadingNewApiKey}
        >
          {loadingNewApiKey ? "Loading..." : "New API Key"}
        </Button>
      </div>
      <h4>Delete Account</h4>
      <Button
        variant="danger"
        type="submit"
        style={{ marginBottom: "20px" }}
        onClick={() => navigate("/delete")}
      >
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
