import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from 'react-bootstrap/Alert';

export default function Dashboard() {
  const { currentUser } = useAuth();

  const [folderMetadata, setFolderMetadata] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFolderMetadata = async () => {
    try {
      setLoading(true);

      const idToken = await currentUser.getIdToken();

      let config = {
        headers: {
          idToken: idToken,
        },
      };

      const response = await axios.get("https://api.seanmabli.com:3433/files", config);

      setFolderMetadata(response.data);

    } catch (err) {
      setError("Error fetching folder metadata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the folder metadata when the component mounts
    fetchFolderMetadata();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <Alert variant="danger" show={error} onClose={() => setError("")} dismissible>
        {error}
      </Alert>
      <div className="files-preview">
        <h2>Past Uploads</h2>
        {isLoading ? (
          <p>Loading folder metadata...</p>
        ) : (
          <ul>
            {folderMetadata.map((metadata, index) => (
              <li key={index}>
                <strong>Folder Name:</strong> {metadata.uploadName}<br />
                <strong>Upload Time:</strong> {metadata.uploadTime}<br />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
