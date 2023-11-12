import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Alert from 'react-bootstrap/Alert';
import { Button, Dropdown } from "react-bootstrap";

export default function DownloadDataset() {
  const [error, setError] = useState("");
  const [selectedDataset, setSelectedDataset] = useState("");

  const datasets = ["FRC 2023", "FRC 2024"];

  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
  };

  const handleDownloadCurl = (dataset) => {
    // Generate the curl command based on the selected dataset
    // You can customize this part according to your server and API
    const curlCommand = `curl -O https://example.com/api/download?dataset=${dataset}`;
    console.log(curlCommand);
    // Here, you can execute the curl command using a library like axios if needed
    // axios.post("your-api-endpoint", { curlCommand });
  };

  const handleDownloadDirectly = (dataset) => {
    // Implement direct download logic here
    // You can redirect the user to the download link or trigger a download
    // window.location.href = "https://example.com/direct-download-link";
    alert(`Downloading ${dataset} directly`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Alert variant="danger" show={error} onClose={() => setError("")} dismissible>
        {error}
      </Alert>
      <h2>Download Dataset</h2>
      <ul>
        {datasets.map((dataset, index) => (
          <li key={index}>
            {dataset}
            <Dropdown>
              <Dropdown.Toggle variant="secondary" id={`dropdown-basic-${index}`} style={{ marginLeft: "10px" }}>
                Download
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleDownloadCurl(dataset)}>
                  Download via Curl
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleDownloadDirectly(dataset)}>
                  Download Directly
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </li>
        ))}
      </ul>

      {selectedDataset && (
        <div>
          <p>Additional information for {selectedDataset}:</p>
          {/* Add additional information here */}
        </div>
      )}
    </div>
  );
}
