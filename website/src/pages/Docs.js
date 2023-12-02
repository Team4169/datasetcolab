import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from "react-bootstrap/Alert";

export default function Docs() {
  const { currentUser } = useAuth();
  const [error, setError] = useState("");

  return (
    <div style={{ padding: "20px" }}>
      <Alert
        variant="danger"
        show={error}
        onClose={() => setError("")}
        dismissible
      >
        {error}
      </Alert>
      <div className="files-preview">
        <h2>Docs</h2>
      </div>
    </div>
  );
}
