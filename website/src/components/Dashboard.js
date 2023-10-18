import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';

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
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Welcome, {currentUser.email}</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <Link to="/update-profile" className="btn btn-primary btn-block">
                  Update Profile
                </Link>
              </div>
              <div className="mb-3">
                <button className="btn btn-secondary btn-block" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
              <div className="form-group">
                <input type="file" className="form-control-file" onChange={onFileChange} multiple />
              </div>
              <div className="text-center">
                <button className="btn btn-primary" onClick={onUpload}>
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
