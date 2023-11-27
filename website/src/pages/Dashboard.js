import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from 'react-bootstrap/Alert';

export default function Dashboard() {
  const { currentUser } = useAuth();

  const [folderMetadata, setFolderMetadata] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolderMetadata = async () => {
    try {
      setLoading(true);

      const idToken = await currentUser.getIdToken();

      let config = {
        headers: {
          idToken: idToken,
        },
      };

      const response = await axios.get("https://api.seanmabli.com:3433/view", config);

      if (Array.isArray(response.data)) {
        setFolderMetadata(response.data);
      } else {
        setFolderMetadata([]); // Set to an empty array if response.data is not an array
      }
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
      <div className="files-preview">
        <h2>Dashboard</h2>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
        {isLoading ? (
          <p>Loading folder metadata...</p>
        ) : (
          <ul>
            {folderMetadata.length > 0 ? (
              folderMetadata.map((metadata, index) => (
                <li key={index}>
                  <strong>Folder Name:</strong> {metadata.uploadName}<br />
                  <strong>Upload Time:</strong> {metadata.uploadTime}<br />
                  <strong>Dataset Type:</strong> {metadata.datasetType}<br />
                </li>
              ))
            ) : (
              <p>No uploads available.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
