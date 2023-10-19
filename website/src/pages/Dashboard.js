import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

export default function Dashboard() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();

  let navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState([]);

  const onFileChange = event => {
      setSelectedFiles([...event.target.files]);
  };

  const onUpload = async () => {
      const formData = new FormData();

      for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
      }

      try {
        const idToken = await currentUser.getIdToken();
        let config = {
          headers: {
            idToken: idToken,
          }
        };
        console.log(config);
            
        await axios.post('https://api.seanmabli.com:3433/upload', formData, config);
        alert('Files uploaded successfully');
      } catch (error) {
        alert('Error uploading files');
      }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {currentUser.email}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="form-group" style={{ marginBottom: "20px" }}>
        <input type="file" className="form-control-file" onChange={onFileChange} multiple />
      </div>
      <div className="text-center">
        <button className="btn btn-primary" onClick={onUpload}>
          Upload
        </button>
      </div>
    </div>
  );
}
