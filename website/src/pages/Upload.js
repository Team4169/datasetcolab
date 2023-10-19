import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

export default function Dashboard() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  let navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState("files"); // Default to individual files
  const [isLoading, setLoading] = useState(false);

  const onFileChange = event => {
    setSelectedFiles(event.target.files);
  };

  const onUpload = async () => {
    if (isLoading) {
      return;
    }

    setLoading(true);

    const formData = new FormData();

    if (uploadMode === "folder") {
      formData.append('folder', selectedFiles[0]);
    } else {
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }
    }

    try {
      const idToken = await currentUser.getIdToken();
      let config = {
        headers: {
          'idToken': idToken, // Add the idToken as a header
          'Content-Type': 'multipart/form-data',
        }
      };

      await axios.post('https://api.seanmabli.com:3433/upload', formData, config);
      alert('Files uploaded successfully');
    } catch (error) {
      if (error.response) {
        // The request was made, but the server responded with an error status
        if (error.response.status === 500) {
          alert('Server error: Failed to save the file on the server.');
        } else {
          alert('Error: ' + error.message);
        }
      } else if (error.request) {
        // The request was made, but no response was received (network error)
        alert('Network error: Unable to communicate with the server.');
      } else {
        // Something happened in setting up the request (request configuration error)
        alert('Request error: Unable to send the request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="form-group" style={{ marginBottom: "20px" }}>
        <label>
          Upload Mode:
          <select
            className="form-control"
            onChange={e => setUploadMode(e.target.value)}
            value={uploadMode}
          >
            <option value="files">Individual Files</option>
            <option value="folder">Folder</option>
          </select>
        </label>
      </div>
      <div className="form-group" style={{ marginBottom: "20px" }}>
        <label>
          Select {uploadMode === "folder" ? "a Folder" : "Files"}:
          <input
            type="file"
            className="form-control-file"
            onChange={onFileChange}
            multiple={uploadMode === "files"}
            webkitdirectory={uploadMode === "folder" ? "webkitdirectory" : undefined}
          />
        </label>
      </div>
      <div className="text-center">
        <button className="btn btn-primary" onClick={onUpload} disabled={isLoading}>
          {isLoading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
