import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from 'react-bootstrap/Alert';

export default function Dashboard() {
  const { currentUser } = useAuth();

  const [folderNames, setFolderNames] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFolderNames = async () => {
    try {
      setLoading(true);

      // Get the user's ID token
      const idToken = await currentUser.getIdToken();

      // Make an HTTP GET request to the server for folder names
      const response = await axios.get("https://api.seanmabli.com:3433/files", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      // Update the state with the folder names
      setFolderNames(response.data);

    } catch (err) {
      setError("Error fetching folder names.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the folder names when the component mounts
    fetchFolderNames();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <Alert variant="danger" show={error} onClose={() => setError("")} dismissible>
        {error}
      </Alert>
      <div className="files-preview">
        <h2>Folder List</h2>
        {isLoading ? (
          <p>Loading folder names...</p>
        ) : (
          <ul>
            {folderNames.map((folderName, index) => (
              <li key={index}>{folderName}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
