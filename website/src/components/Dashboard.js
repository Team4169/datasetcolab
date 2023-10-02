import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

export default function Dashboard() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();

  let navigate = useNavigate();

  async function handleLogout() {
    setError("");

    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to log out");
    }
  }


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
          await axios.post('https://api.seanmabli.com:3433/upload', formData);
          //await axios.post('https://localhost:3433/upload', formData);
          alert('Files uploaded successfully');
      } catch (error) {
          alert('Error uploading files');
      }
  };

  return (
    <>
      {error && alert(error)}
      <p>Email: {currentUser.email}</p>
      <Link to="/update-profile" className="btn btn-primary w-100 mt-3">
        Update Profile
      </Link>
      <br />
      <button onclick={handleLogout}>Log Out</button>
      <br />
      <input type="file" onChange={onFileChange} multiple />
      <button onClick={onUpload}>Upload</button>
    </>
  );
}