import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Alert from "react-bootstrap/Alert";
import Markdown from 'react-markdown';

export default function Docs() {
  const { currentUser } = useAuth();
  const [error, setError] = useState("");
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/src/docs/YOLOv5n.md") // Update the file path to include the site root
      .then((response) => response.text())
      .then((data) => {
        console.log(data); // Log the response data
        setMarkdown(data);
      })
      .catch((error) => setError(error.message));
  }, []);

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
        <Markdown>{markdown}</Markdown>
      </div>
    </div>
  );
}
