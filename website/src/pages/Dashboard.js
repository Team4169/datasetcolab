import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from 'react-bootstrap/Alert';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

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
    fetchFolderMetadata();
  }, []);

  function formatUploadTime(uploadTime) {
    const [datePart, timePart] = uploadTime.split('_');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
  
    const formattedDate = new Date(year, month - 1, day, hour, minute).toLocaleString();
    return formattedDate;
  }

  function formatTargetDataset(targetDataset) {
    const formattedTargetDataset = targetDataset.replace(/FRC(\d{4})/, 'FRC $1');
    return formattedTargetDataset;
  }

  const navigate = useNavigate();

  const redirectToView = (folderName) => {
    navigate(`/view/${folderName}`);
  };

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
          <div>
            {folderMetadata.length > 0 ? (
              folderMetadata
                .sort((a, b) => {
                  const nanosecondsA = new Date(a.uploadTime).getTime() * 1e6; // Convert to nanoseconds
                  const nanosecondsB = new Date(b.uploadTime).getTime() * 1e6; // Convert to nanoseconds
                  return nanosecondsB - nanosecondsA; // Sort in descending order
                })
                .map((metadata, index) => {
                  const formattedUploadTime = formatUploadTime(metadata.uploadTime);
                  const formattedTargetDataset = formatTargetDataset(metadata.targetDataset);

                  return (
                    <div key={index}>
                      <Card key={index} style={styles.datasetCard}>
                        <Card.Body>
                          <h3>{metadata.uploadName}</h3>
                          <small><strong>Upload Time:</strong> {formattedUploadTime}</small>
                          <br />
                          <small><strong>Dataset Type:</strong> {metadata.datasetType}</small>
                          <br />
                          <small><strong>Target Dataset:</strong> {formattedTargetDataset}</small>
                          <br />
                          <Button
                            variant="primary"
                            className="position-absolute top-0 end-0 m-3"
                            onClick={() => redirectToView(metadata.folderName)}
                          >
                            View
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  );
                })
            ) : (
              <p>No uploads available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
